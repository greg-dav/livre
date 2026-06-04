import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { BookCard, BookGrid, Icon, Loader, Text } from '@livre/primitives';
import { type SearchResult } from '@livre/types';
import { api } from '../../lib/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useSearchSession } from '../../context/SearchContext';
import {
  searchScopeSchema,
  searchSortSchema,
  shelfFilterSchema,
  type ShelfFilter,
} from '@livre/types';
import {
  dedupeByRef,
  SCOPE_LABELS,
  SHELF_LABELS,
  SORT_LABELS,
  STATUS_LABELS,
} from '../../lib/search';
import { Layout, SortMenu, LoadMore, ManualEntryDialog } from '../../components';
import {
  Split,
  LeftRail,
  PanelHeader,
  PanelDivider,
  FacetRow,
  FacetTick,
  FacetName,
  FacetCount,
  RightCol,
  QueryBar,
  Field,
  FieldInput,
  ManualHint,
  ManualHintButton,
  Results,
  Toolbar,
  HeadLine,
  ActiveChips,
  Chip,
  ChipClose,
  StateNote,
} from './Search.styles';

const publishedYear = (book: SearchResult): string => book.publishedDate?.slice(0, 4) ?? '';

/**
 * Faceted search over the book catalog. The scope, shelf filter, and sort are all sent to the
 * server, which matches, filters, orders, paginates, and annotates each hit with the user's library
 * state — the client just renders the result set and the shelf counts it's handed. Session state
 * (query, scope, shelf, sort) lives in SearchProvider so it survives a detour into a book detail;
 * the query is also mirrored to the URL (?q=) so the page is shareable and the top-bar can escalate.
 */
export const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { term, setTerm, scope, setScope, shelf, toggleShelf, sort, setSort } = useSearchSession();
  const [manualOpen, setManualOpen] = useState(false);

  const debounced = useDebounce(term, 300);
  const queryTerm = debounced.trim();

  // Adopt a query carried in on the URL (shared link or top-bar escalation) into the session once.
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setTerm(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror the committed query back to the URL so the result page stays shareable.
  useEffect(() => {
    setSearchParams(queryTerm ? { q: queryTerm } : {}, { replace: true });
  }, [queryTerm, setSearchParams]);

  // A single selected bucket narrows; none or both means "no shelf filter" (the server sees both).
  const shelfParam = shelf.size === 1 ? [...shelf][0] : undefined;

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['books', 'search', scope, queryTerm, shelfParam ?? 'all', sort],
    queryFn: ({ pageParam }) =>
      api.search.search(queryTerm, {
        scope,
        shelf: shelfParam,
        sort,
        startIndex: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextStartIndex ?? undefined,
    enabled: queryTerm.length > 1,
    staleTime: 60_000,
  });

  const results = dedupeByRef(data?.pages.flatMap((page) => page.results) ?? []);
  // Counts accumulate across loaded pages: "of everything pulled so far, how many sit on each shelf".
  const shelfCounts = (data?.pages ?? []).reduce(
    (acc, page) => ({ in: acc.in + page.shelfCounts.in, out: acc.out + page.shelfCounts.out }),
    { in: 0, out: 0 }
  );

  const count = results.length;
  const hasQuery = queryTerm.length > 1;

  const renderShelfFacet = (key: ShelfFilter) => (
    <FacetRow
      key={key}
      $active={shelf.has(key)}
      $disabled={shelfCounts[key] === 0 && !shelf.has(key)}
      onClick={() => toggleShelf(key)}
    >
      <FacetTick $active={shelf.has(key)}>
        {shelf.has(key) && <Icon icon="check" size={10} />}
      </FacetTick>
      <FacetName>
        <Text className="facet-name" variant="ui-tight">
          {SHELF_LABELS[key]}
        </Text>
      </FacetName>
      <FacetCount>
        <Text variant="ui-xs" color="muted">
          {shelfCounts[key]}
        </Text>
      </FacetCount>
    </FacetRow>
  );

  return (
    <Layout fullWidth title="Search">
      <Split>
        <LeftRail>
          <PanelHeader>
            <Text variant="label" color="accent">
              Match in
            </Text>
            <PanelDivider />
          </PanelHeader>
          {searchScopeSchema.options.map((s) => (
            <FacetRow key={s} $active={scope === s} $radio onClick={() => setScope(s)}>
              <FacetTick $active={scope === s} $radio>
                {scope === s && <Icon icon="check" size={9} />}
              </FacetTick>
              <FacetName>
                <Text className="facet-name" variant="ui-tight">
                  {SCOPE_LABELS[s]}
                </Text>
              </FacetName>
            </FacetRow>
          ))}

          <PanelHeader $spaced>
            <Text variant="label" color="accent">
              Shelf
            </Text>
            <PanelDivider />
          </PanelHeader>
          {shelfFilterSchema.options.map(renderShelfFacet)}
        </LeftRail>

        <RightCol>
          <QueryBar>
            <Field>
              <Icon icon="search" size={18} />
              <FieldInput
                value={term}
                placeholder="Search by title, author, subject…"
                autoFocus
                onChange={(e) => setTerm(e.target.value)}
              />
            </Field>
            <ManualHint>
              <Text variant="ui-sm" color="muted">
                Can’t find it, or it isn’t in the catalog?
              </Text>
              <ManualHintButton type="button" onClick={() => setManualOpen(true)}>
                <Icon icon="add" size={14} />
                <Text variant="ui-sm" color="accent">
                  Add a book manually
                </Text>
              </ManualHintButton>
            </ManualHint>
          </QueryBar>

          <Results>
            <Toolbar>
              <HeadLine>
                {hasQuery ? (
                  <>
                    <Text variant="ui-sm" color="muted">
                      Showing
                    </Text>
                    <Text variant="h6" as="span">
                      {count}
                    </Text>
                    <Text variant="ui-sm" color="muted">
                      {count === 1 ? 'result' : 'results'} for “{queryTerm}”
                    </Text>
                  </>
                ) : (
                  <Text variant="ui-sm" color="muted">
                    Start typing to search every book.
                  </Text>
                )}
              </HeadLine>
              {hasQuery && (
                <SortMenu
                  value={sort}
                  onChange={setSort}
                  options={searchSortSchema.options}
                  labels={SORT_LABELS}
                />
              )}
            </Toolbar>

            <ActiveChips>
              <Chip>
                <Text variant="ui-sm" color="accent">
                  Match: {SCOPE_LABELS[scope]}
                </Text>
                {scope !== 'anything' && (
                  <ChipClose onClick={() => setScope('anything')}>
                    <Text variant="ui-sm" color="accent">
                      ×
                    </Text>
                  </ChipClose>
                )}
              </Chip>
              {[...shelf].map((key) => (
                <Chip key={key}>
                  <Text variant="ui-sm" color="accent">
                    {SHELF_LABELS[key]}
                  </Text>
                  <ChipClose onClick={() => toggleShelf(key)}>
                    <Text variant="ui-sm" color="accent">
                      ×
                    </Text>
                  </ChipClose>
                </Chip>
              ))}
            </ActiveChips>

            {!hasQuery ? null : isLoading ? (
              <Loader />
            ) : count === 0 && !hasNextPage ? (
              <StateNote>
                <Text variant="body1" color="muted">
                  No books match “{queryTerm}” with these filters.
                </Text>
              </StateNote>
            ) : (
              <>
                <BookGrid>
                  {results.map((book) => (
                    <BookCard
                      key={book.bookRef}
                      title={book.title}
                      author={[book.authors[0], publishedYear(book)].filter(Boolean).join(' · ')}
                      coverUrl={book.largeThumbnail ?? book.thumbnail}
                      inLibrary={book.libraryStatus !== null}
                      spineLabel={
                        book.libraryStatus ? STATUS_LABELS[book.libraryStatus] : undefined
                      }
                      onClick={() =>
                        navigate(
                          book.libraryBookId !== null
                            ? `/library/${book.libraryBookId}`
                            : `/search/book/${encodeURIComponent(book.bookRef)}`,
                          { state: { backLabel: 'Search' } }
                        )
                      }
                    />
                  ))}
                </BookGrid>
                {hasNextPage && (
                  <LoadMore onClick={() => fetchNextPage()} loading={isFetchingNextPage} />
                )}
              </>
            )}
          </Results>
        </RightCol>
      </Split>
      <ManualEntryDialog open={manualOpen} onOpenChange={setManualOpen} seedTitle={queryTerm} />
    </Layout>
  );
};

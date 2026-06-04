import { useState, useMemo } from 'react';
import countBy from 'lodash/countBy';
import flatMap from 'lodash/flatMap';
import sortBy from 'lodash/sortBy';
import union from 'lodash/union';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { BookCard, BookGrid, Loader, Text } from '@livre/primitives';
import {
  Layout,
  SortMenu,
  CurrentlyReadingCard,
  ShelfTabs,
  TagFacet,
  type ShelfStatus,
  type TagFacetOption,
} from '../../components';
import { api } from '../../lib/api';
import {
  Split,
  LeftPanel,
  LeftPanelHeader,
  LeftPanelDivider,
  RightPanel,
  ShelfHeading,
  ShelfHeadingLeft,
  EmptyNote,
} from './Library.styles';

const SHELF_LABELS: Record<ShelfStatus, string> = {
  read: 'Read',
  want: 'Want to Read',
  dnf: 'Did Not Finish',
};

type LibrarySort = 'newest' | 'oldest';
const LIBRARY_SORT_OPTIONS = ['newest', 'oldest'] as const;
const LIBRARY_SORT_LABELS: Record<LibrarySort, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/**
 * Main authenticated screen. Split layout: sticky left panel for currently-reading books and a
 * tag facet, right panel for the shelf browser. Shelf data is live from the API — tab counts stay
 * in sync because every shelf response includes counts for all statuses. Tag selection lives here
 * so it persists across tab switches; the facet is scoped to the active shelf and filters with OR.
 */
export const Library = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeShelf, setActiveShelf] = useState<ShelfStatus>('read');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<LibrarySort>('newest');

  const { data: readingData } = useQuery({
    queryKey: ['shelves', 'reading'],
    queryFn: () => api.library.shelf('reading'),
  });

  const { data } = useQuery({
    queryKey: ['shelves', activeShelf],
    queryFn: () => api.library.shelf(activeShelf),
    placeholderData: keepPreviousData,
  });

  const { mutate: logEntry } = useMutation({
    mutationFn: ({
      libraryBookId,
      type,
      text,
    }: {
      libraryBookId: number;
      type: 'note' | 'quote';
      text: string;
    }) => api.library.log(libraryBookId, type, undefined, text),
    onSuccess: (_data, { libraryBookId }) => {
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
    },
  });

  const readingEntries = readingData?.entries ?? [];
  const shelfEntries = useMemo(() => data?.entries ?? [], [data]);
  const tabCounts = data
    ? { read: data.counts.read, want: data.counts.want, dnf: data.counts.dnf }
    : { read: 0, want: 0, dnf: 0 };

  // Tag options scope to the active shelf; selected tags absent from it stay listed (count 0) so
  // they remain deselectable. Counts and dimming recompute as the shelf changes.
  const tagOptions = useMemo<TagFacetOption[]>(() => {
    const counts = countBy(flatMap(shelfEntries, 'tags'));
    const tags = union(Object.keys(counts), [...selectedTags]);
    return sortBy(
      tags.map((tag) => ({ tag, count: counts[tag] ?? 0 })),
      'tag'
    );
  }, [shelfEntries, selectedTags]);

  const visibleEntries = useMemo(() => {
    const matched =
      selectedTags.size === 0
        ? shelfEntries
        : shelfEntries.filter((entry) => entry.tags.some((tag) => selectedTags.has(tag)));
    const byAdded = sortBy(matched, 'addedDate');
    return sort === 'newest' ? byAdded.reverse() : byAdded;
  }, [shelfEntries, selectedTags, sort]);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });

  const clearTags = () => setSelectedTags(new Set());

  const filtered = selectedTags.size > 0;
  const count = visibleEntries.length;

  return (
    <Layout fullWidth title="Library">
      <Split>
        <LeftPanel>
          <LeftPanelHeader>
            <Text variant="label" color="accent">
              Currently Reading
            </Text>
            <LeftPanelDivider />
          </LeftPanelHeader>
          {readingEntries.map((entry) => (
            <CurrentlyReadingCard
              key={entry.libraryBookId}
              title={entry.title}
              author={entry.authors.join(', ')}
              coverUrl={entry.coverUrl ?? undefined}
              startedDate={formatDate(entry.startedDate ?? entry.addedDate)}
              onClick={() => navigate(`/library/${entry.libraryBookId}`)}
              onLog={(type, text) => logEntry({ libraryBookId: entry.libraryBookId, type, text })}
            />
          ))}
          {tagOptions.length > 0 && (
            <>
              <LeftPanelHeader $spaced>
                <Text variant="label" color="accent">
                  Tags
                </Text>
                <LeftPanelDivider />
              </LeftPanelHeader>
              <TagFacet
                options={tagOptions}
                selected={selectedTags}
                onToggle={toggleTag}
                onClear={clearTags}
              />
            </>
          )}
        </LeftPanel>
        <RightPanel>
          <ShelfTabs active={activeShelf} counts={tabCounts} onChange={setActiveShelf} />
          <ShelfHeading>
            <ShelfHeadingLeft>
              <Text variant="h3" as="h2">
                {SHELF_LABELS[activeShelf]}
              </Text>
              {filtered ? (
                <Text variant="ui-tight" color="accent">
                  {count} {count === 1 ? 'book' : 'books'} · {[...selectedTags].join(', ')}
                </Text>
              ) : (
                <Text variant="label" color="muted">
                  {count} {count === 1 ? 'book' : 'books'}
                </Text>
              )}
            </ShelfHeadingLeft>
            {shelfEntries.length > 0 && (
              <SortMenu
                value={sort}
                onChange={setSort}
                options={LIBRARY_SORT_OPTIONS}
                labels={LIBRARY_SORT_LABELS}
              />
            )}
          </ShelfHeading>
          {!data ? (
            <Loader />
          ) : count === 0 && filtered ? (
            <EmptyNote>
              <Text variant="body1" color="muted">
                No books on this shelf carry those tags.
              </Text>
            </EmptyNote>
          ) : (
            <BookGrid>
              {visibleEntries.map((entry) => (
                <BookCard
                  key={entry.libraryBookId}
                  title={entry.title}
                  author={entry.authors.join(', ')}
                  coverUrl={entry.coverUrl ?? undefined}
                  rating={entry.rating ?? undefined}
                  onClick={() => navigate(`/library/${entry.libraryBookId}`)}
                />
              ))}
            </BookGrid>
          )}
        </RightPanel>
      </Split>
    </Layout>
  );
};

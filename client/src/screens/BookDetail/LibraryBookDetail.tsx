import { Fragment, useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Text, Button, DropdownMenu, Lightbox, Loader, Pill } from '@livre/primitives';
import { type LogEventType } from '@livre/types';
import { api } from '../../lib/api';
import { pushRecentBook } from '../../lib/recentBooks';
import { Layout } from '../../components';
import {
  Hero,
  CoverWrapper,
  Cover,
  CoverPlaceholder,
  HeroMeta,
  AuthorList,
  AuthorLink,
  Byline,
  Dot,
  Divider,
  Description,
  DescriptionSection,
  SectionLabel,
  Categories,
  HeroActions,
  ReadingSince,
  ReadingSinceDot,
  MetaGrid,
  MetaLabel,
  MetaValue,
} from './BookDetail.styles';
import {
  STATUS_LABELS,
  SELECTABLE_EVENTS,
  dedupeAuthors,
  formatIsbn,
  formatLanguage,
  formatPublishedDate,
  formatReadingSince,
  stripDescriptionPreamble,
} from './BookDetail.utils';

/**
 * Detail view for a book in the user's library. Resolves the internal userBookId to a Google
 * Books ID via the library cache, then fetches the full volume. Shows library-specific UI:
 * current status in the action button, "Reading since" indicator, and (eventually) the journal
 * sidecar. The acquisition animation fires once when navigated here from the search path.
 */
export const LibraryBookDetail = () => {
  const { userBookId: userBookIdStr } = useParams<{ userBookId: string }>();
  const userBookId = Number(userBookIdStr);
  const location = useLocation();
  const queryClient = useQueryClient();

  const [justAcquired, setJustAcquired] = useState(
    (location.state as { justAcquired?: boolean } | null)?.justAcquired === true
  );

  useEffect(() => {
    if (!justAcquired) return;
    const t = window.setTimeout(() => setJustAcquired(false), 600);
    return () => window.clearTimeout(t);
  }, []);

  const { data: libraryData } = useQuery({
    queryKey: ['library'],
    queryFn: () => api.books.library(),
    staleTime: Infinity,
  });

  const entry = libraryData?.find((e) => e.userBookId === userBookId) ?? null;
  const googleId = entry?.googleId ?? null;

  const { data: book } = useQuery({
    queryKey: ['books', 'detail', googleId],
    queryFn: () => api.books.getById(googleId!),
    enabled: !!googleId,
  });

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (event: LogEventType) => {
      if (!googleId) throw new Error('No book ID');
      return api.books.log(googleId, event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  useEffect(() => {
    if (!book || !googleId) return;
    pushRecentBook({
      googleId,
      title: book.title,
      authors: book.authors,
      thumbnail: book.thumbnail,
    });
  }, [googleId, book]);

  const savedStatus = entry?.status ?? null;
  const readingStartedDate = entry?.startedDate ?? null;

  const [coverIndex, setCoverIndex] = useState(0);
  const coverSrcs = [book?.largeThumbnail, book?.thumbnail].filter((u): u is string => !!u);
  const coverSrc = coverSrcs[coverIndex];

  if (!book || !entry) {
    return (
      <Layout>
        <Loader />
      </Layout>
    );
  }

  const year = book.publishedDate?.slice(0, 4);
  const byline = [year, book.publisher, book.pageCount ? `${book.pageCount} pp` : undefined].filter(
    Boolean
  );

  return (
    <Layout>
      <Hero>
        {coverSrc ? (
          <Lightbox srcs={coverSrcs} alt={book.title}>
            <CoverWrapper $inLibrary $justAcquired={justAcquired}>
              <Cover src={coverSrc} alt={book.title} onError={() => setCoverIndex((i) => i + 1)} />
            </CoverWrapper>
          </Lightbox>
        ) : (
          <CoverPlaceholder />
        )}
        <HeroMeta>
          <Text variant="h2" as="h1">
            {book.title}
          </Text>
          <AuthorList>
            {dedupeAuthors(book.authors).map((author, i) => (
              <Fragment key={author}>
                {i > 0 && <Dot>·</Dot>}
                <AuthorLink to={`/author/${encodeURIComponent(author)}`}>
                  <Text variant="ui-lg">{author}</Text>
                </AuthorLink>
              </Fragment>
            ))}
          </AuthorList>
          {byline.length > 0 && (
            <Byline>
              {byline.map((item, i) => (
                <Fragment key={i}>
                  {i > 0 && <Dot>·</Dot>}
                  <Text variant="ui-sm" color="muted" as="span">
                    {item}
                  </Text>
                </Fragment>
              ))}
            </Byline>
          )}
          <HeroActions>
            <DropdownMenu
              trigger={
                <Button variant="primary" size="sm" disabled={isSaving}>
                  <Text variant="label" color="onColor">
                    {savedStatus ? STATUS_LABELS[savedStatus] : 'In library'} ▾
                  </Text>
                </Button>
              }
            >
              {SELECTABLE_EVENTS.map(({ event, label }) => (
                <DropdownMenu.Item key={event} onSelect={() => save(event)}>
                  <Text variant="ui-sm">{label}</Text>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu>
          </HeroActions>
          {savedStatus === 'reading' && readingStartedDate && (
            <ReadingSince>
              <ReadingSinceDot />
              <Text variant="ui-sm" color="muted">
                Reading since {formatReadingSince(readingStartedDate)}
              </Text>
            </ReadingSince>
          )}
        </HeroMeta>
      </Hero>

      {book.description && (
        <>
          <Divider />
          <DescriptionSection>
            <SectionLabel>
              <Text variant="label" color="muted">
                Description
              </Text>
            </SectionLabel>
            <Description>
              {stripDescriptionPreamble(book.description)
                .split(/\n\n+/)
                .map((paragraph, i) => (
                  <Text key={i} variant="body1">
                    {paragraph}
                  </Text>
                ))}
            </Description>
            {book.categories.length > 0 && (
              <Categories>
                {book.categories.map((category) => (
                  <Pill key={category}>
                    <Text variant="ui-sm" color="muted">
                      {category}
                    </Text>
                  </Pill>
                ))}
              </Categories>
            )}
          </DescriptionSection>
        </>
      )}

      <Divider />
      <MetaGrid>
        {book.isbn && (
          <>
            <MetaLabel>
              <Text variant="label" color="muted">
                ISBN
              </Text>
            </MetaLabel>
            <MetaValue>
              <Text variant="mono">{formatIsbn(book.isbn)}</Text>
            </MetaValue>
          </>
        )}
        {book.language && (
          <>
            <MetaLabel>
              <Text variant="label" color="muted">
                Language
              </Text>
            </MetaLabel>
            <MetaValue>
              <Text variant="ui-sm">{formatLanguage(book.language)}</Text>
            </MetaValue>
          </>
        )}
        {book.publisher && (
          <>
            <MetaLabel>
              <Text variant="label" color="muted">
                Publisher
              </Text>
            </MetaLabel>
            <MetaValue>
              <Text variant="ui-sm">{book.publisher}</Text>
            </MetaValue>
          </>
        )}
        {book.publishedDate && (
          <>
            <MetaLabel>
              <Text variant="label" color="muted">
                Published
              </Text>
            </MetaLabel>
            <MetaValue>
              <Text variant="ui-sm">{formatPublishedDate(book.publishedDate)}</Text>
            </MetaValue>
          </>
        )}
      </MetaGrid>
    </Layout>
  );
};

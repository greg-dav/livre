import { Fragment, useEffect, useLayoutEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  MetaGrid,
  MetaLabel,
  MetaValue,
} from './BookDetail.styles';
import {
  SELECTABLE_EVENTS,
  dedupeAuthors,
  formatIsbn,
  formatLanguage,
  formatPublishedDate,
  stripDescriptionPreamble,
} from './BookDetail.utils';

/**
 * Discovery view for a book not yet in the library. Fetches full volume data by Google Books ID.
 * If the book is already in the library (detected from the library cache), redirects immediately
 * to the library path. On save, redirects to the library path and triggers the acquisition
 * animation.
 */
export const SearchBookDetail = () => {
  const { googleId } = useParams<{ googleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: book } = useQuery({
    queryKey: ['books', 'detail', googleId],
    queryFn: () => api.books.getById(googleId!),
    enabled: !!googleId,
  });

  const { data: libraryData } = useQuery({
    queryKey: ['library'],
    queryFn: () => api.books.library(),
    staleTime: Infinity,
  });

  useLayoutEffect(() => {
    if (!libraryData || !googleId) return;
    const entry = libraryData.find((e) => e.googleId === googleId);
    if (entry) navigate(`/library/${entry.userBookId}`, { replace: true });
  }, [libraryData, googleId, navigate]);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (event: LogEventType) => {
      if (!googleId) throw new Error('No book ID');
      return api.books.log(googleId, event);
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      navigate(`/library/${data.userBookId}`, { state: { justAcquired: true } });
    },
  });

  useEffect(() => {
    if (!book) return;
    pushRecentBook({
      googleId: googleId!,
      title: book.title,
      authors: book.authors,
      thumbnail: book.thumbnail,
    });
  }, [googleId, book]);

  const [coverIndex, setCoverIndex] = useState(0);
  const coverSrcs = [book?.largeThumbnail, book?.thumbnail].filter((u): u is string => !!u);
  const coverSrc = coverSrcs[coverIndex];

  if (!book) {
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
            <CoverWrapper>
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
                    Add to library ▾
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

import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Text, Button, DropdownMenu, Lightbox, Loader } from '@livre/primitives';
import { shelfStatusSchema, type ShelfStatus } from '@livre/types';
import { api } from '../../lib/api';
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
  MetaGrid,
  MetaLabel,
  MetaValue,
} from './BookDetail.styles';

const STATUS_LABELS: Record<ShelfStatus, string> = {
  want: 'Want to Read',
  reading: 'Currently Reading',
  read: 'Read',
  dnf: 'Did Not Finish',
};

/**
 * Full detail view for a single book. Always fetches the full volume by ID — search results only
 * carry small thumbnails, so we need the individual endpoint for high-res covers. Author names
 * link to the author page. Metadata shown when available — all fields from Google Books are optional.
 */
export const BookDetail = () => {
  const { googleId } = useParams<{ googleId: string }>();
  const queryClient = useQueryClient();

  const { data: book } = useQuery({
    queryKey: ['books', 'detail', googleId],
    queryFn: () => api.books.getById(googleId!),
    enabled: !!googleId,
  });

  const { data: libraryIds } = useQuery({
    queryKey: ['library'],
    queryFn: () => api.books.library(),
    staleTime: Infinity,
  });

  const savedStatus = useMemo(
    () => libraryIds?.find((e) => e.googleId === googleId)?.status ?? null,
    [libraryIds, googleId]
  );

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (status: ShelfStatus) => {
      if (!googleId) throw new Error('No book ID');
      return api.books.save(googleId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

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
            <CoverWrapper $inLibrary={savedStatus !== null}>
              <Cover src={coverSrc} alt={book.title} onError={() => setCoverIndex((i) => i + 1)} />
            </CoverWrapper>
          </Lightbox>
        ) : (
          <CoverPlaceholder />
        )}
        <HeroMeta>
          <Text variant="h3" as="h1">
            {book.title}
          </Text>
          <AuthorList>
            {book.authors.map((author) => (
              <AuthorLink key={author} to={`/author/${encodeURIComponent(author)}`}>
                <Text variant="ui-md">{author}</Text>
              </AuthorLink>
            ))}
          </AuthorList>
          {byline.length > 0 && (
            <Byline>
              {byline.map((item, i) => (
                <span key={i}>
                  {i > 0 && <Dot>·&nbsp;</Dot>}
                  <Text variant="ui-sm" color="muted" as="span">
                    {item}
                  </Text>
                </span>
              ))}
            </Byline>
          )}
          <DropdownMenu
            trigger={
              <Button variant="secondary" size="sm" disabled={isSaving}>
                <Text variant="label" color="default">
                  {savedStatus ? STATUS_LABELS[savedStatus] : 'Add to library'}
                </Text>
              </Button>
            }
          >
            {shelfStatusSchema.options.map((status) => (
              <DropdownMenu.Item key={status} onSelect={() => save(status)}>
                <Text variant="ui-sm">{STATUS_LABELS[status]}</Text>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu>
        </HeroMeta>
      </Hero>

      {book.description && (
        <>
          <Divider />
          <Description>
            <Text variant="body1">{book.description}</Text>
          </Description>
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
              <Text variant="ui-sm">{book.isbn}</Text>
            </MetaValue>
          </>
        )}
        {book.categories.length > 0 && (
          <>
            <MetaLabel>
              <Text variant="label" color="muted">
                Categories
              </Text>
            </MetaLabel>
            <MetaValue>
              <Text variant="ui-sm">{book.categories.join(', ')}</Text>
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
              <Text variant="ui-sm">{book.language.toUpperCase()}</Text>
            </MetaValue>
          </>
        )}
      </MetaGrid>
    </Layout>
  );
};

import { useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Text } from '@livre/primitives';
import { type BookSearchResult } from '@livre/types';
import { api } from '../../lib/api';
import { Layout } from '../../components';
import {
  Hero,
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

/**
 * Full detail view for a single book. Navigated to from search results (data arrives via router
 * state, no fetch needed) or directly by URL (fetches from the server). Author names link to the
 * author page. Metadata shown when available — all fields from Google Books are optional.
 */
export const BookDetail = () => {
  const { googleId } = useParams<{ googleId: string }>();
  const location = useLocation();
  const stateBook = location.state?.book as BookSearchResult | undefined;

  const { data: fetchedBook } = useQuery({
    queryKey: ['books', 'detail', googleId],
    queryFn: () => api.books.getById(googleId!),
    enabled: !!googleId && !stateBook,
  });

  const book = stateBook ?? fetchedBook;

  if (!book) {
    return (
      <Layout>
        <Text variant="ui-sm" color="muted">
          Loading…
        </Text>
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
        {(book.largeThumbnail ?? book.thumbnail) ? (
          <Cover src={(book.largeThumbnail ?? book.thumbnail)!} alt={book.title} />
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

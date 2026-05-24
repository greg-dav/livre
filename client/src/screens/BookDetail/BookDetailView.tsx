import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import { Text, Lightbox, Pill } from '@livre/primitives';
import { type BookVolume } from '@livre/types';
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
  dedupeAuthors,
  formatIsbn,
  formatLanguage,
  formatPublishedDate,
  stripDescriptionPreamble,
} from './BookDetail.utils';

interface BookDetailViewProps {
  book: BookVolume;
  inLibrary?: boolean;
  justAcquired?: boolean;
  actions: ReactNode;
  statusIndicator?: ReactNode;
}

/**
 * Shared layout for book detail screens. Renders cover, title, authors, byline, description, and
 * meta grid. Variable elements — the action button and any status indicator — are passed as slots
 * so both the discovery and library views reuse this structure without coupling to each other's
 * data or mutation logic.
 */
export const BookDetailView = ({
  book,
  inLibrary,
  justAcquired,
  actions,
  statusIndicator,
}: BookDetailViewProps) => {
  const [coverIndex, setCoverIndex] = useState(0);
  const coverSrcs = [book.largeThumbnail, book.thumbnail].filter((u): u is string => !!u);
  const coverSrc = coverSrcs[coverIndex];

  const year = book.publishedDate?.slice(0, 4);
  const byline = [year, book.publisher, book.pageCount ? `${book.pageCount} pp` : undefined].filter(
    Boolean
  );

  return (
    <Layout>
      <Hero>
        {coverSrc ? (
          <Lightbox srcs={coverSrcs} alt={book.title}>
            <CoverWrapper $inLibrary={inLibrary} $justAcquired={justAcquired}>
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
          <HeroActions>{actions}</HeroActions>
          {statusIndicator}
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

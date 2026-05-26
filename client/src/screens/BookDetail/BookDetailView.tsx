import { Fragment, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Text, Lightbox, Pill } from '@livre/primitives';
import { type BookVolume } from '@livre/types';
import { Layout } from '../../components';
import {
  LayoutGrid,
  LeftColumn,
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
  /** When provided, renders alongside the book content in a two-column layout. */
  journal?: ReactNode;
}

/**
 * Shared layout for book detail screens. Renders cover, title, authors, byline, description, and
 * meta grid. Variable elements — the action button, status indicator, and optional journal panel
 * — are passed as slots so both the discovery and library views reuse this structure without
 * coupling to each other's data or mutation logic. When journal is provided, the page becomes a
 * two-column layout (content + sticky rail); otherwise it stays single-column.
 */
export const BookDetailView = ({
  book,
  inLibrary,
  justAcquired,
  actions,
  statusIndicator,
  journal,
}: BookDetailViewProps) => {
  const [coverIndex, setCoverIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const coverSrcs = [book.largeThumbnail, book.thumbnail].filter((u): u is string => !!u);
  const coverSrc = coverSrcs[coverIndex];

  useEffect(() => {
    setImgLoaded(false);
    if (imgRef.current?.complete) setImgLoaded(true);
  }, [coverSrc]);

  const handleCoverError = useCallback(() => {
    setImgLoaded(false);
    setCoverIndex((i) => i + 1);
  }, []);

  const year = book.publishedDate?.slice(0, 4);
  const byline = [year, book.publisher, book.pageCount ? `${book.pageCount} pp` : undefined].filter(
    Boolean
  );

  const content = (
    <>
      <Hero>
        {coverSrc ? (
          <Lightbox srcs={coverSrcs} alt={book.title}>
            <CoverWrapper $inLibrary={inLibrary} $justAcquired={justAcquired}>
              <Cover
                ref={imgRef}
                src={coverSrc}
                alt={book.title}
                $loaded={imgLoaded}
                onLoad={() => setImgLoaded(true)}
                onError={handleCoverError}
              />
            </CoverWrapper>
          </Lightbox>
        ) : (
          <CoverPlaceholder>
            <Text variant="body2" color="onColor">
              {book.title}
            </Text>
            <Text variant="ui-xs" color="onColorMuted">
              {dedupeAuthors(book.authors).join(', ')}
            </Text>
          </CoverPlaceholder>
        )}
        <HeroMeta>
          <Text variant="h2" as="h1">
            {book.title}
          </Text>
          <AuthorList>
            {dedupeAuthors(book.authors).map((author, i) => (
              <Fragment key={author}>
                {i > 0 && <Dot>·</Dot>}
                <AuthorLink
                  to={`/search/author/${encodeURIComponent(author)}`}
                  state={{ backLabel: book.title }}
                >
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
            {book.tags.length > 0 && (
              <Categories>
                {book.tags.map((tag) => (
                  <Pill key={tag}>
                    <Text variant="ui-sm" color="muted">
                      {tag}
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
    </>
  );

  return (
    <Layout>
      {journal ? (
        <LayoutGrid>
          <LeftColumn>{content}</LeftColumn>
          {journal}
        </LayoutGrid>
      ) : (
        content
      )}
    </Layout>
  );
};

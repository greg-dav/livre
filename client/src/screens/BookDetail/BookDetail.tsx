import { Fragment, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Text, Button, DropdownMenu, Lightbox, Loader, Pill } from '@livre/primitives';
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
  DescriptionSection,
  SectionLabel,
  Categories,
  HeroActions,
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

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

const formatLanguage = (code: string): string => {
  try {
    return languageNames.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

/*
 * Publisher descriptions from Google often start with marketing preambles like
 * "NEW YORK TIMES BESTSELLER" or "OVER 5 MILLION COPIES SOLD" on their own line. They're noise
 * for our use case. Strip leading lines that are entirely uppercase letters and spaces.
 */
const stripDescriptionPreamble = (description: string): string =>
  description.replace(/^([A-Z ]+\n+)+/, '');

/*
 * Google returns ISBNs sometimes unformatted ("9781250237231") and sometimes pre-hyphenated.
 * Apply a heuristic grouping for the common English-language pattern: 3-1-3-5-1 for ISBN-13 and
 * 1-3-5-1 for ISBN-10. Exact grouping varies by registration group/publisher prefix — this
 * trades precision for predictability. Pass-through if the input doesn't look like a bare ISBN.
 */
const formatIsbn = (raw: string): string => {
  const digits = raw.replace(/[^0-9X]/gi, '');
  if (digits.length === 13) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 12)}-${digits.slice(12)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return raw;
};

/*
 * Google often returns the same author multiple times with slight variations — middle initials
 * present in one entry and absent in another ("Michael D. Matthews" / "Michael Matthews"), or
 * with suffixes added inconsistently ("Robert Caslen" / "Robert L. Caslen Jr."). Normalize by
 * stripping middle initials, suffixes, and punctuation, then keep the first occurrence of each
 * unique key to preserve the publisher's intended ordering.
 */
const dedupeAuthors = (authors: string[]): string[] => {
  const normalize = (name: string) =>
    name
      .toLowerCase()
      .replace(/\b(jr|sr|iii|ii|iv)\.?\b/g, '')
      .replace(/\b\w\.\s*/g, '')
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const seen = new Set<string>();
  return authors.filter((author) => {
    const key = normalize(author);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const formatPublishedDate = (raw: string): string => {
  // Google returns YYYY, YYYY-MM, or YYYY-MM-DD; render the most specific form we can.
  const parts = raw.split('-');
  if (parts.length === 3) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime())
      ? raw
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (parts.length === 2) {
    const d = new Date(`${raw}-01`);
    return Number.isNaN(d.getTime())
      ? raw
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }
  return raw;
};

/**
 * Full detail view for a single book. Always fetches the full volume by ID — search results only
 * carry small thumbnails, so we need the individual endpoint for high-res covers. Author names
 * link to the author page. Metadata shown when available — all fields from Google Books are
 * optional. Categories render as pills below the description; publication metadata sits at the
 * bottom in a definition grid.
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

  const [justAcquired, setJustAcquired] = useState(false);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (status: ShelfStatus) => {
      if (!googleId) throw new Error('No book ID');
      return api.books.save(googleId, status);
    },
    onSuccess: () => {
      const wasNew = !savedStatus;
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      if (wasNew) {
        // Play the acquisition animation once. ~550ms covers ring slip (200ms) + shimmer
        // (350ms, starting at 120ms so they overlap) with a small buffer; flag clears so a
        // future re-add can play again.
        setJustAcquired(true);
        window.setTimeout(() => setJustAcquired(false), 600);
      }
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
            <CoverWrapper $inLibrary={savedStatus !== null} $justAcquired={justAcquired}>
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
                    {savedStatus ? STATUS_LABELS[savedStatus] : 'Add to library'} ▾
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

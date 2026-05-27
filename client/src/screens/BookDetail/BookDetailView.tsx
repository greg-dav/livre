import { Fragment, useState, useCallback, useEffect, useRef } from 'react';
import { useDescriptionEdit } from './useDescriptionEdit';
import { useCoverEdit } from './useCoverEdit';
import type { ReactNode } from 'react';
import { Text, Lightbox, Dialog, Input, Button } from '@livre/primitives';
import { type BookVolume } from '@livre/types';
import { Layout } from '../../components';
import {
  LayoutGrid,
  LeftColumn,
  Hero,
  CoverWrapper,
  CoverEditOverlay,
  CoverEditButton,
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
  DescriptionInlineEditor,
  SectionLabel,
  HeroActions,
  MetaGrid,
  MetaLabel,
  MetaValue,
  CoverDialogForm,
  CoverDialogActions,
} from './BookDetail.styles';
import { TagList } from './TagList';
import { dedupeAuthors, formatIsbn, formatLanguage, formatPublishedDate } from './BookDetail.utils';

interface BookDetailViewProps {
  book: BookVolume;
  inLibrary?: boolean;
  justAcquired?: boolean;
  editable?: boolean;
  actions: ReactNode;
  statusIndicator?: ReactNode;
  onTagsChange?: (tags: string[]) => void;
  onDescriptionChange?: (description: string) => void;
  onCoverChange?: (url: string) => void;
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
  editable,
  actions,
  statusIndicator,
  onTagsChange,
  onDescriptionChange,
  onCoverChange,
  journal,
}: BookDetailViewProps) => {
  const [coverIndex, setCoverIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const coverSrcs = [book.largeThumbnail, book.thumbnail].filter((u): u is string => !!u);
  const coverSrc = coverSrcs[coverIndex];

  const description = useDescriptionEdit(book.description, onDescriptionChange);
  const coverEdit = useCoverEdit(onCoverChange);

  useEffect(() => {
    setCoverIndex(0);
  }, [book.largeThumbnail, book.thumbnail]);

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

  const descriptionEditable = editable && !!onDescriptionChange;
  const coverEditable = editable && !!onCoverChange;

  const coverEditOverlay = coverEditable ? (
    <CoverEditOverlay>
      <CoverEditButton type="button" onClick={coverEdit.openDialog}>
        <Text variant="label">Change cover</Text>
      </CoverEditButton>
    </CoverEditOverlay>
  ) : null;

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
              {coverEditOverlay}
            </CoverWrapper>
          </Lightbox>
        ) : (
          <CoverPlaceholder>
            <Text variant="body2" color="onDark">
              {book.title}
            </Text>
            <Text variant="ui-xs" color="onDarkMuted">
              {dedupeAuthors(book.authors).join(', ')}
            </Text>
            {coverEditOverlay}
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

      {(book.description || descriptionEditable) && (
        <>
          <Divider />
          <DescriptionSection>
            <SectionLabel>
              <Text variant="label" color="muted">
                Description
              </Text>
            </SectionLabel>
            <Description>
              {descriptionEditable ? (
                <Text variant="body1" as="div">
                  <DescriptionInlineEditor
                    ref={description.editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false}
                    onFocus={description.handleFocus}
                    onBlur={description.handleBlur}
                    onInput={description.handleInput}
                    onKeyDown={description.handleKeyDown}
                  />
                </Text>
              ) : (
                (book.description ?? '').split(/\n\n+/).map((paragraph, i) => (
                  <Text key={i} variant="body1">
                    {paragraph}
                  </Text>
                ))
              )}
            </Description>
            <TagList tags={book.tags} editable={editable} onChange={onTagsChange} />
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

      {coverEditable && (
        <Dialog
          open={coverEdit.open}
          onOpenChange={coverEdit.handleOpenChange}
          title="Change cover"
          description="Paste an image URL to use as this book's cover."
        >
          <CoverDialogForm onSubmit={coverEdit.handleSave}>
            <Input
              type="url"
              placeholder="https://..."
              value={coverEdit.url}
              onChange={(e) => coverEdit.setUrl(e.target.value)}
              autoFocus
            />
            <CoverDialogActions>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" type="button">
                  <Text variant="label">Cancel</Text>
                </Button>
              </Dialog.Close>
              <Button variant="primary" size="sm" type="submit" disabled={!coverEdit.url.trim()}>
                <Text variant="label" color="onColor">
                  Save
                </Text>
              </Button>
            </CoverDialogActions>
          </CoverDialogForm>
        </Dialog>
      )}
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

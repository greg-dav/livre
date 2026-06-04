import { Fragment, useState, useCallback, useEffect, useRef } from 'react';
import { useDescriptionEdit } from '../../hooks/useDescriptionEdit';
import { useTitleEdit } from '../../hooks/useTitleEdit';
import { useCoverEdit } from '../../hooks/useCoverEdit';
import { usePublisherEdit } from '../../hooks/usePublisherEdit';
import { usePageCountEdit } from '../../hooks/usePageCountEdit';
import { useDateEdit } from '../../hooks/useDateEdit';
import { useLanguageEdit } from '../../hooks/useLanguageEdit';
import { useIsbnEdit } from '../../hooks/useIsbnEdit';
import type { ReactNode } from 'react';
import { Text, Lightbox, Dialog, Input, Button, EditableField } from '@livre/primitives';
import { type LibraryVolume, type UpdateMetadataBody, type BookFormat } from '@livre/types';
import { Layout } from '../../../../components';
import { FormatSelector } from '../FormatSelector/FormatSelector';
import {
  LayoutGrid,
  LeftColumn,
  FocusStrip,
  FocusStripCoverThemed,
  FocusStripInfo,
  FocusStripSep,
  ExitFocusButton,
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
  TitleInlineEditor,
  SectionLabel,
  HeroActions,
  MetaGrid,
  MetaLabel,
  MetaValue,
  CoverDialogForm,
  CoverDialogActions,
} from './BookDetailView.styles';
import { TagList } from '../TagList/TagList';
import { PublisherDialog } from '../MetaEditDialogs/PublisherDialog';
import { PageCountDialog } from '../MetaEditDialogs/PageCountDialog';
import { DateDialog } from '../MetaEditDialogs/DateDialog';
import { LanguageDialog } from '../MetaEditDialogs/LanguageDialog';
import { IsbnDialog } from '../MetaEditDialogs/IsbnDialog';
import {
  dedupeAuthors,
  formatIsbn,
  formatLanguage,
  formatPublishedDate,
} from '../../utils/BookDetail.utils';

interface BookDetailViewProps {
  book: LibraryVolume;
  inLibrary?: boolean;
  justAcquired?: boolean;
  editable?: boolean;
  actions: ReactNode;
  statusIndicator?: ReactNode;
  onTagsChange?: (tags: string[]) => void;
  tagSuggestions?: string[];
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  onCoverChange?: (url: string) => void;
  onPublisherChange?: (publisher: string) => void;
  onPageCountChange?: (pageCount: number) => void;
  onPublishedDateChange?: (publishedDate: string) => void;
  onLanguageChange?: (language: string) => void;
  onIsbnChange?: (isbn: string) => void;
  onMetadataChange?: (fields: UpdateMetadataBody) => void;
  /** When provided, renders alongside the book content in a two-column layout. */
  journal?: ReactNode;
  focusMode?: boolean;
  onExitFocus?: () => void;
  focusStripMeta?: ReactNode;
  currentFormat?: BookFormat | null;
  onFormatChange?: (format: BookFormat) => void;
}

/**
 * Shared layout for book detail screens. Renders cover, title, authors, byline, description, and
 * meta grid. Variable elements — the action button, status indicator, and optional journal panel
 * — are passed as slots so both the discovery and library views reuse this structure without
 * coupling to each other's data or mutation logic. When journal is provided, the page becomes a
 * two-column layout (content + sticky rail); otherwise it stays single-column.
 *
 * Metadata fields (ISBN, language, publisher, published date, page count) are editable via modal
 * dialogs when the corresponding onChange callbacks are provided alongside editable=true. Raw text
 * fields (title, description) use inline contenteditable editing.
 */
export const BookDetailView = ({
  book,
  inLibrary,
  justAcquired,
  editable,
  actions,
  statusIndicator,
  onTagsChange,
  tagSuggestions,
  onTitleChange,
  onDescriptionChange,
  onCoverChange,
  onPublisherChange,
  onPageCountChange,
  onPublishedDateChange,
  onLanguageChange,
  onIsbnChange,
  onMetadataChange,
  journal,
  focusMode,
  onExitFocus,
  focusStripMeta,
  currentFormat,
  onFormatChange,
}: BookDetailViewProps) => {
  const [coverIndex, setCoverIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const coverSrcs = [book.largeThumbnail, book.thumbnail].filter((u): u is string => !!u);
  const coverSrc = coverSrcs[coverIndex];

  const titleEdit = useTitleEdit(book.title, onTitleChange);
  const descriptionEdit = useDescriptionEdit(book.description, onDescriptionChange);
  const coverEdit = useCoverEdit(onCoverChange);
  const publisherEdit = usePublisherEdit(book.publisher, onPublisherChange);
  const pageCountEdit = usePageCountEdit(book.pageCount, onPageCountChange);
  const dateEdit = useDateEdit(book.publishedDate, onPublishedDateChange);
  const languageEdit = useLanguageEdit(book.language, onLanguageChange);
  const isbnEdit = useIsbnEdit(book.isbn, onIsbnChange, onMetadataChange);

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

  const titleEditable = editable && !!onTitleChange;
  const descriptionEditable = editable && !!onDescriptionChange;
  const coverEditable = editable && !!onCoverChange;
  const metaEditable =
    editable &&
    !!(
      onPublisherChange ||
      onPageCountChange ||
      onPublishedDateChange ||
      onLanguageChange ||
      onIsbnChange
    );

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
            {titleEditable ? (
              <TitleInlineEditor
                ref={titleEdit.editorRef}
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                onFocus={titleEdit.handleFocus}
                onBlur={titleEdit.handleBlur}
                onInput={titleEdit.handleInput}
                onKeyDown={titleEdit.handleKeyDown}
                onPaste={titleEdit.handlePaste}
              />
            ) : (
              book.title
            )}
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
          {editable && onFormatChange && (
            <FormatSelector value={currentFormat ?? null} onChange={onFormatChange} />
          )}
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
                    ref={descriptionEdit.editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false}
                    onFocus={descriptionEdit.handleFocus}
                    onBlur={descriptionEdit.handleBlur}
                    onInput={descriptionEdit.handleInput}
                    onKeyDown={descriptionEdit.handleKeyDown}
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
            <TagList
              tags={book.tags}
              editable={editable}
              onChange={onTagsChange}
              suggestions={tagSuggestions}
            />
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
              {metaEditable && onIsbnChange ? (
                <EditableField type="button" onClick={isbnEdit.openDialog}>
                  <Text variant="mono">{formatIsbn(book.isbn)}</Text>
                </EditableField>
              ) : (
                <Text variant="mono">{formatIsbn(book.isbn)}</Text>
              )}
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
              {metaEditable && onLanguageChange ? (
                <EditableField type="button" onClick={languageEdit.openDialog}>
                  <Text variant="ui-sm">{formatLanguage(book.language)}</Text>
                </EditableField>
              ) : (
                <Text variant="ui-sm">{formatLanguage(book.language)}</Text>
              )}
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
              {metaEditable && onPublisherChange ? (
                <EditableField type="button" onClick={publisherEdit.openDialog}>
                  <Text variant="ui-sm">{book.publisher}</Text>
                </EditableField>
              ) : (
                <Text variant="ui-sm">{book.publisher}</Text>
              )}
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
              {metaEditable && onPublishedDateChange ? (
                <EditableField type="button" onClick={dateEdit.openDialog}>
                  <Text variant="ui-sm">{formatPublishedDate(book.publishedDate)}</Text>
                </EditableField>
              ) : (
                <Text variant="ui-sm">{formatPublishedDate(book.publishedDate)}</Text>
              )}
            </MetaValue>
          </>
        )}
        {book.pageCount && (
          <>
            <MetaLabel>
              <Text variant="label" color="muted">
                Pages
              </Text>
            </MetaLabel>
            <MetaValue>
              {metaEditable && onPageCountChange ? (
                <EditableField type="button" onClick={pageCountEdit.openDialog}>
                  <Text variant="ui-sm">{book.pageCount}</Text>
                </EditableField>
              ) : (
                <Text variant="ui-sm">{book.pageCount}</Text>
              )}
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

      {metaEditable && (
        <>
          {onPublisherChange && <PublisherDialog {...publisherEdit} />}
          {onPageCountChange && <PageCountDialog {...pageCountEdit} />}
          {onPublishedDateChange && <DateDialog {...dateEdit} />}
          {onLanguageChange && <LanguageDialog {...languageEdit} />}
          {onIsbnChange && <IsbnDialog {...isbnEdit} />}
        </>
      )}
    </>
  );

  const focusStrip =
    focusMode && journal ? (
      <FocusStrip>
        <FocusStripCoverThemed>
          {coverSrc && <img src={coverSrc} alt={book.title} />}
        </FocusStripCoverThemed>
        <FocusStripInfo>
          <Text variant="h4" as="span">
            {book.title}
          </Text>
          <Text variant="ui-tight" color="muted">
            {dedupeAuthors(book.authors).join(', ')}
            {focusStripMeta && (
              <>
                <FocusStripSep>·</FocusStripSep>
                {focusStripMeta}
              </>
            )}
          </Text>
        </FocusStripInfo>
        <ExitFocusButton type="button" onClick={onExitFocus}>
          <Text variant="label">↩ Back to book</Text>
        </ExitFocusButton>
      </FocusStrip>
    ) : null;

  return (
    <Layout title={book.title} focusMode={focusMode}>
      {journal ? (
        <>
          {focusStrip}
          <LayoutGrid $focusMode={focusMode}>
            <LeftColumn $focusMode={focusMode}>{content}</LeftColumn>
            {journal}
          </LayoutGrid>
        </>
      ) : (
        content
      )}
    </Layout>
  );
};

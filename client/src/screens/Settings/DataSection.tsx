import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, Icon, ProgressBar, Text } from '@livre/primitives';
import { type ImportSource, type BookSource, type LibraryFormat } from '@livre/types';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errorMessage';
import { Section } from './Section';
import {
  Block,
  BlockHead,
  Actions,
  Feedback,
  DialogActions,
  DialogBody,
  FormatCard,
  FormatList,
  FormatOption,
  OptionLabel,
  Meter,
  FileRow,
  ResultList,
  ResultRow,
} from './Settings.styles';

/** The format chooser wrapped in a labelled card, shared by the import and export dialogs. */
const FormatField = (props: {
  formats: LibraryFormat[];
  selected: string;
  onSelect: (id: string) => void;
}) => (
  <FormatCard>
    <Text variant="label" color="muted">
      Format
    </Text>
    <FormatList>
      {props.formats.map((format) => {
        const active = format.id === props.selected;
        return (
          <FormatOption
            key={format.id}
            type="button"
            $selected={active}
            onClick={() => props.onSelect(format.id)}
          >
            <Text variant="ui-md" color={active ? 'accent' : 'default'}>
              {format.label}
            </Text>
            {active && <Icon icon="check" size={16} />}
          </FormatOption>
        );
      })}
    </FormatList>
  </FormatCard>
);

/**
 * Metadata-source chooser for import. Each source is selectable; a metered source (Google Books)
 * also shows today's per-instance usage as a bar + caption so the reader can see how much lookup
 * budget is left before committing to a large import.
 */
const ImportSourceField = (props: {
  options: ImportSource[];
  selected: BookSource;
  onSelect: (id: BookSource) => void;
}) => {
  const current = props.options.find((o) => o.id === props.selected);
  return (
    <FormatCard>
      <Text variant="label" color="muted">
        Metadata source
      </Text>
      <FormatList>
        {props.options.map((option) => {
          const active = option.id === props.selected;
          return (
            <FormatOption
              key={option.id}
              type="button"
              $selected={active}
              onClick={() => props.onSelect(option.id)}
            >
              <OptionLabel>
                <Text variant="ui-md" color={active ? 'accent' : 'default'}>
                  {option.label}
                </Text>
                <Text variant="ui-xs" color="muted">
                  {option.usage
                    ? `${option.usage.remaining} of ${option.usage.limit} lookups left today`
                    : 'Free · unlimited'}
                </Text>
              </OptionLabel>
              {active && <Icon icon="check" size={16} />}
            </FormatOption>
          );
        })}
      </FormatList>
      {current?.usage && (
        <Meter>
          <ProgressBar value={(current.usage.used / Math.max(current.usage.limit, 1)) * 100} />
          <Text variant="ui-xs" color="muted">
            {current.usage.used} / {current.usage.limit} used today · resets midnight Pacific
          </Text>
        </Meter>
      )}
    </FormatCard>
  );
};

/**
 * Library-wide data tools: import a library from another app, export everything, or wipe the whole
 * library. All act on the signed-in reader's own data only. Import and export each open a modal
 * listing the formats the server advertises, so adding a server-side format surfaces here with no
 * change. Deletion stays guarded behind a confirmation dialog.
 */
export const DataSection = () => {
  const queryClient = useQueryClient();
  const formatsQuery = useQuery({ queryKey: ['formats'], queryFn: () => api.books.listFormats() });
  const formats = formatsQuery.data ?? [];

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormatId, setExportFormatId] = useState<string | null>(null);
  const exportFormats = formats.filter((f) => f.capabilities.export);
  const exportSelected = exportFormatId ?? exportFormats[0]?.id ?? '';

  const [importOpen, setImportOpen] = useState(false);
  const [importFormatId, setImportFormatId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFormats = formats.filter((f) => f.capabilities.import);
  const importSelected = importFormatId ?? importFormats[0]?.id ?? '';

  const importSourcesQuery = useQuery({
    queryKey: ['import-sources'],
    queryFn: () => api.books.importSources(),
  });
  const importSources = importSourcesQuery.data ?? [];
  const [sourceId, setSourceId] = useState<BookSource | null>(null);
  const selectedSourceId = sourceId ?? importSources[0]?.id ?? 'OPEN_LIBRARY';
  const selectedSource = importSources.find((o) => o.id === selectedSourceId);
  const quotaExhausted = !!selectedSource?.usage && selectedSource.usage.remaining <= 0;

  const [confirmOpen, setConfirmOpen] = useState(false);

  const exportMutation = useMutation({
    mutationFn: (formatId: string) => api.books.exportLibrary(formatId),
    onSuccess: ({ filename, blob }) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    },
  });

  const importMutation = useMutation({
    mutationFn: ({
      formatId,
      file,
      source,
    }: {
      formatId: string;
      file: File;
      source: BookSource;
    }) => api.books.importLibrary(formatId, file, source),
    onSuccess: () => {
      // New books and reading-log events landed; refetch so the library, shelves, and timeline show
      // them. Refetch import sources too so the Google meter reflects the lookups this import spent.
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['log'] });
      queryClient.invalidateQueries({ queryKey: ['import-sources'] });
    },
  });

  const closeImport = () => {
    setImportOpen(false);
    setFile(null);
    importMutation.reset();
  };

  const deleteMutation = useMutation({
    mutationFn: () => api.books.deleteLibrary(),
    onSuccess: () => {
      // Everything reading-related is now empty; refetch so the library, shelves, and timeline clear.
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['log'] });
      setConfirmOpen(false);
    },
  });

  const result = importMutation.data;

  return (
    <Section
      title="Data"
      description="Move your library in or out of this Livre instance, or erase it."
    >
      <Block>
        <BlockHead>
          <Text variant="label" color="accent">
            Import
          </Text>
          <Text variant="ui-sm" color="muted">
            Bring a library in from another app. Books already in your library are skipped, so
            re-importing the same file is safe.
          </Text>
        </BlockHead>
        <Actions>
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            <Icon icon="download" size={16} />
            <Text variant="label" color="default">
              Import
            </Text>
          </Button>
        </Actions>
      </Block>

      <Block>
        <BlockHead>
          <Text variant="label" color="accent">
            Export
          </Text>
          <Text variant="ui-sm" color="muted">
            Download every book, rating, review, and reading-log entry as a file you can move into
            another app.
          </Text>
        </BlockHead>
        <Actions>
          <Button variant="secondary" size="sm" onClick={() => setExportOpen(true)}>
            <Icon icon="upload" size={16} />
            <Text variant="label" color="default">
              Export
            </Text>
          </Button>
        </Actions>
      </Block>

      <Block>
        <BlockHead>
          <Text variant="label" color="accent">
            Delete library
          </Text>
          <Text variant="ui-sm" color="muted">
            Permanently remove every book, rating, review, and reading-log entry. Your account and
            settings are kept. This cannot be undone.
          </Text>
        </BlockHead>
        <Actions>
          <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
            <Icon icon="delete" size={16} />
            <Text variant="label" color="onDark">
              Delete library
            </Text>
          </Button>
        </Actions>
        <Feedback>
          {deleteMutation.isSuccess && (
            <Text variant="ui-sm" color="accent">
              Library deleted.
            </Text>
          )}
        </Feedback>
      </Block>

      <Dialog
        open={exportOpen}
        onOpenChange={(open) => !open && setExportOpen(false)}
        title="Export library"
        description="Choose a format. The file downloads to your device."
      >
        <DialogBody>
          <FormatField
            formats={exportFormats}
            selected={exportSelected}
            onSelect={setExportFormatId}
          />
          {exportMutation.isPending && <ProgressBar />}
          {exportMutation.isError && (
            <Feedback>
              <Text variant="ui-sm" color="destructive">
                {errorMessage(exportMutation.error, 'Failed to export library')}
              </Text>
            </Feedback>
          )}
        </DialogBody>
        <DialogActions>
          <Dialog.Close asChild>
            <Button variant="ghost" size="sm">
              <Text variant="label" color="default">
                Cancel
              </Text>
            </Button>
          </Dialog.Close>
          <Button
            variant="primary"
            size="sm"
            disabled={!exportSelected || exportMutation.isPending}
            onClick={() => exportMutation.mutate(exportSelected)}
          >
            <Text variant="label" color="onColor">
              {exportMutation.isPending ? 'Exporting…' : 'Export'}
            </Text>
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => !open && closeImport()}
        title="Import library"
        description="Choose a format and a file. Books already in your library are skipped."
      >
        {result ? (
          <>
            <DialogBody>
              <ResultList>
                <ResultRow>
                  <Text variant="ui-sm" color="muted">
                    Imported
                  </Text>
                  <Text variant="ui-sm" color="success">
                    {result.imported}
                  </Text>
                </ResultRow>
                <ResultRow>
                  <Text variant="ui-sm" color="muted">
                    Skipped (already in library)
                  </Text>
                  <Text variant="ui-sm" color="default">
                    {result.skipped}
                  </Text>
                </ResultRow>
                <ResultRow>
                  <Text variant="ui-sm" color="muted">
                    Failed
                  </Text>
                  <Text variant="ui-sm" color={result.failed > 0 ? 'destructive' : 'default'}>
                    {result.failed}
                  </Text>
                </ResultRow>
                {result.deferred > 0 && (
                  <ResultRow>
                    <Text variant="ui-sm" color="muted">
                      Deferred (daily limit reached)
                    </Text>
                    <Text variant="ui-sm" color="default">
                      {result.deferred}
                    </Text>
                  </ResultRow>
                )}
              </ResultList>
              {result.deferred > 0 && (
                <Feedback>
                  <Text variant="ui-sm" color="muted">
                    Run the import again after the daily limit resets (midnight Pacific) to bring in
                    the deferred books.
                  </Text>
                </Feedback>
              )}
            </DialogBody>
            <DialogActions>
              <Button variant="primary" size="sm" onClick={closeImport}>
                <Text variant="label" color="onColor">
                  Done
                </Text>
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogBody>
              <FormatField
                formats={importFormats}
                selected={importSelected}
                onSelect={setImportFormatId}
              />
              {importSources.length > 1 && (
                <ImportSourceField
                  options={importSources}
                  selected={selectedSourceId}
                  onSelect={setSourceId}
                />
              )}
              {quotaExhausted && (
                <Feedback>
                  <Text variant="ui-sm" color="muted">
                    Today&rsquo;s Google Books lookups are used up — this import would defer every
                    book. Switch to Open Library to import now, or try again after midnight Pacific.
                  </Text>
                </Feedback>
              )}
              <FileRow>
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Text variant="label" color="default">
                    Choose file
                  </Text>
                </Button>
                <Text variant="ui-sm" color="muted">
                  {file?.name ?? 'No file selected'}
                </Text>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </FileRow>
              {importMutation.isPending && <ProgressBar />}
              {importMutation.isError && (
                <Feedback>
                  <Text variant="ui-sm" color="destructive">
                    {errorMessage(importMutation.error, 'Failed to import library')}
                  </Text>
                </Feedback>
              )}
            </DialogBody>
            <DialogActions>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">
                  <Text variant="label" color="default">
                    Cancel
                  </Text>
                </Button>
              </Dialog.Close>
              <Button
                variant="primary"
                size="sm"
                disabled={!file || !importSelected || importMutation.isPending}
                onClick={() =>
                  file &&
                  importMutation.mutate({
                    formatId: importSelected,
                    file,
                    source: selectedSourceId,
                  })
                }
              >
                <Text variant="label" color="onColor">
                  {importMutation.isPending ? 'Importing…' : 'Import'}
                </Text>
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !open && setConfirmOpen(false)}
        title="Delete library"
        description="This permanently removes every book, rating, review, and reading-log entry from your library. Your account and settings are kept. This cannot be undone."
      >
        <DialogActions>
          <Dialog.Close asChild>
            <Button variant="ghost" size="sm">
              <Text variant="label" color="default">
                Cancel
              </Text>
            </Button>
          </Dialog.Close>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            <Text variant="label" color="onDark">
              {deleteMutation.isPending ? 'Deleting…' : 'Delete everything'}
            </Text>
          </Button>
        </DialogActions>
        {deleteMutation.isError && (
          <Text variant="ui-sm" color="destructive">
            {errorMessage(deleteMutation.error, 'Failed to delete library')}
          </Text>
        )}
      </Dialog>
    </Section>
  );
};

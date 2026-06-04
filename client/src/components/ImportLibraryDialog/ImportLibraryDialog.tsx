import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, Icon, ProgressBar, Text } from '@livre/primitives';
import { type ImportSource, type BookSource, type LibraryFormat } from '@livre/types';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errorMessage';
import {
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
  Feedback,
} from './ImportLibraryDialog.styles';

/** The format chooser wrapped in a labelled card. */
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

interface ImportLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Import a library from another app's export file. Self-contained so it can be opened from anywhere
 * — Settings' data tools and the first-run empty library both render it. Lists the formats and
 * metadata sources the server advertises (so adding a server-side format or source surfaces here
 * with no change), runs the import, and shows a tally of imported / skipped / failed when done. On
 * success the library, shelves, timeline, and source-usage caches are invalidated so the new books
 * and spent lookups appear immediately. The caller owns open state.
 */
export const ImportLibraryDialog = (props: ImportLibraryDialogProps) => {
  const queryClient = useQueryClient();

  const formatsQuery = useQuery({
    queryKey: ['formats'],
    queryFn: () => api.library.listFormats(),
  });
  const importFormats = (formatsQuery.data ?? []).filter((f) => f.capabilities.import);

  const [importFormatId, setImportFormatId] = useState<string | null>(null);
  const importSelected = importFormatId ?? importFormats[0]?.id ?? '';

  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importSourcesQuery = useQuery({
    queryKey: ['import-sources'],
    queryFn: () => api.library.importSources(),
  });
  const importSources = importSourcesQuery.data ?? [];
  const [sourceId, setSourceId] = useState<BookSource | null>(null);
  const selectedSourceId = sourceId ?? importSources[0]?.id ?? 'OPEN_LIBRARY';
  const selectedSource = importSources.find((o) => o.id === selectedSourceId);
  const quotaExhausted = !!selectedSource?.usage && selectedSource.usage.remaining <= 0;

  const importMutation = useMutation({
    mutationFn: ({
      formatId,
      file,
      source,
    }: {
      formatId: string;
      file: File;
      source: BookSource;
    }) => api.library.importLibrary(formatId, file, source),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['log'] });
      queryClient.invalidateQueries({ queryKey: ['import-sources'] });
    },
  });

  const close = () => {
    props.onOpenChange(false);
    setFile(null);
    importMutation.reset();
  };

  const result = importMutation.data;

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => !open && close()}
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
            <Button variant="primary" size="sm" onClick={close}>
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
  );
};

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, Icon, ProgressBar, Text } from '@livre/primitives';
import { type LibraryFormat } from '@livre/types';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errorMessage';
import { ImportLibraryDialog } from '../../components';
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
 * Library-wide data tools: import a library from another app, export everything, or wipe the whole
 * library. All act on the signed-in reader's own data only. Import and export each open a modal
 * listing the formats the server advertises, so adding a server-side format surfaces here with no
 * change. Deletion stays guarded behind a confirmation dialog.
 */
export const DataSection = () => {
  const queryClient = useQueryClient();
  const formatsQuery = useQuery({
    queryKey: ['formats'],
    queryFn: () => api.library.listFormats(),
  });
  const formats = formatsQuery.data ?? [];

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormatId, setExportFormatId] = useState<string | null>(null);
  const exportFormats = formats.filter((f) => f.capabilities.export);
  const exportSelected = exportFormatId ?? exportFormats[0]?.id ?? '';

  const [importOpen, setImportOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const exportMutation = useMutation({
    mutationFn: (formatId: string) => api.library.exportLibrary(formatId),
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

  const deleteMutation = useMutation({
    mutationFn: () => api.library.deleteLibrary(),
    onSuccess: () => {
      // Everything reading-related is now empty; refetch so the library, shelves, and timeline clear.
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['log'] });
      setConfirmOpen(false);
    },
  });

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

      <ImportLibraryDialog open={importOpen} onOpenChange={setImportOpen} />

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

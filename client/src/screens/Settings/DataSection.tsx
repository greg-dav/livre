import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, Icon, Text } from '@livre/primitives';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errorMessage';
import { SectionHead, Block, BlockHead, Actions, Feedback, DialogActions } from './Settings.styles';

/**
 * Library-wide data tools: export everything to a Goodreads-shaped CSV, or wipe the whole library.
 * Both act on the signed-in reader's own data only. Deletion is guarded behind a confirmation dialog
 * and clears the cached library/shelves/timeline so the rest of the app reflects the empty state.
 */
export const DataSection = () => {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const exportMutation = useMutation({
    mutationFn: () => api.books.exportLibraryCsv(),
    onSuccess: ({ filename, blob }) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    },
  });

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

  return (
    <>
      <SectionHead>
        <Text variant="h3" as="h2">
          Data
        </Text>
        <Text variant="ui-sm" color="muted">
          Export your library or erase it from this Livre instance.
        </Text>
      </SectionHead>

      <Block>
        <BlockHead>
          <Text variant="label" color="accent">
            Export
          </Text>
          <Text variant="ui-sm" color="muted">
            Download every book, rating, review, and reading-log entry as a CSV. The format mirrors
            Goodreads&rsquo; export, so you can move your library between apps.
          </Text>
        </BlockHead>
        <Actions>
          <Button
            variant="secondary"
            size="sm"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate()}
          >
            <Icon icon="download" size={16} />
            <Text variant="label" color="default">
              {exportMutation.isPending ? 'Exporting…' : 'Export CSV'}
            </Text>
          </Button>
        </Actions>
        <Feedback>
          {exportMutation.isError && (
            <Text variant="ui-sm" color="destructive">
              {errorMessage(exportMutation.error, 'Failed to export library')}
            </Text>
          )}
        </Feedback>
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
    </>
  );
};

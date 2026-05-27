import { Text, Input, Button } from '@livre/primitives';
import { MetaEditDialog } from '../MetaEditDialog/MetaEditDialog';
import { IsbnLookupResult } from './IsbnLookupResult';
import { LookupRow } from './IsbnDialog.styles';
import type { useIsbnEdit } from '../../hooks/useIsbnEdit';

/**
 * Modal for editing the ISBN. Phase 1: enter an ISBN-10 or ISBN-13 and optionally look it up
 * against the books service. Phase 2 (on a hit): show the found book with options to update
 * all metadata or save the ISBN only. The hook drives the phase machine; this component is
 * purely presentational.
 */
export const IsbnDialog = (props: ReturnType<typeof useIsbnEdit>) => {
  const { phase, foundBook, lookupError } = props;

  const title = phase === 'found' ? 'Update from ISBN lookup' : 'Edit ISBN';

  const description =
    phase === 'found'
      ? 'A matching book was found. You can update all metadata, or save the ISBN only.'
      : phase === 'not-found'
        ? 'No book was found for that ISBN. You can still save it.'
        : 'Enter an ISBN-10 or ISBN-13.';

  return (
    <MetaEditDialog
      open={props.open}
      onOpenChange={props.handleOpenChange}
      title={title}
      description={description}
      isValid={props.isValidFormat}
      onSave={props.handleSaveIsbnOnly}
      hideActions={phase === 'found'}
    >
      {phase !== 'found' && (
        <>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 978-1-250-23723-1"
            value={props.draft}
            onChange={(e) => props.setDraft(e.target.value)}
            autoFocus
          />
          <LookupRow>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={!props.isValidFormat || phase === 'looking'}
              onClick={props.handleLookup}
            >
              <Text variant="label">{phase === 'looking' ? 'Looking up…' : 'Look up'}</Text>
            </Button>
            {lookupError && (
              <Text variant="ui-xs" color="muted">
                {lookupError}
              </Text>
            )}
            {phase === 'not-found' && (
              <Text variant="ui-xs" color="muted">
                No match found.
              </Text>
            )}
          </LookupRow>
        </>
      )}

      {phase === 'found' && foundBook && (
        <IsbnLookupResult
          book={foundBook}
          onSaveIsbnOnly={props.handleSaveIsbnOnly}
          onSaveWithMetadata={props.handleSaveWithMetadata}
        />
      )}
    </MetaEditDialog>
  );
};

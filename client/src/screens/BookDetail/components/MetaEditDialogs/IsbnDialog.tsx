import { Text } from '@livre/primitives';
import { MetaEditDialog } from '../MetaEditDialog/MetaEditDialog';
import { IsbnLookupResult } from './IsbnLookupResult';
import {
  IsbnInputWrapper,
  IsbnBareInput,
  InlineDivider,
  InlineLookupButton,
  StatusText,
} from './IsbnDialog.styles';
import type { useIsbnEdit } from '../../hooks/useIsbnEdit';

/**
 * Modal for editing the ISBN. Phase 1: enter an ISBN-10 or ISBN-13 via an auto-hyphen mask;
 * the Look up button sits inline at the end of the input. Phase 2 (on a hit): show the found
 * book with options to update all metadata or save the ISBN only. The hook drives the phase
 * machine; this component is purely presentational.
 */
export const IsbnDialog = (props: ReturnType<typeof useIsbnEdit>) => {
  const { phase, foundBook, lookupError } = props;

  const title = phase === 'found' ? 'Update from ISBN lookup' : 'Edit ISBN';

  const description =
    phase === 'found'
      ? 'A matching book was found. You can update all metadata, or save the ISBN only.'
      : phase === 'not-found'
        ? 'No book was found for that ISBN. You can still save it.'
        : undefined;

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
          <IsbnInputWrapper>
            <IsbnBareInput
              type="text"
              inputMode="numeric"
              placeholder="978-X-XXX-XXXXX-X"
              maxLength={17}
              value={props.draft}
              onChange={(e) => props.handleIsbnChange(e.target.value)}
              autoFocus
            />
            <InlineDivider />
            <InlineLookupButton
              type="button"
              disabled={!props.isValidFormat || phase === 'looking'}
              onClick={props.handleLookup}
            >
              <Text variant="label">{phase === 'looking' ? 'Looking up…' : 'Look up'}</Text>
            </InlineLookupButton>
          </IsbnInputWrapper>
          {lookupError && (
            <StatusText>
              <Text variant="ui-xs" color="muted">
                {lookupError}
              </Text>
            </StatusText>
          )}
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

import { Icon, Text } from '@livre/primitives';
import { useCardLogComposer } from './useCardLogComposer';
import {
  Card,
  CoverThumb,
  CoverThumbImg,
  Body,
  MainRow,
  SinceRow,
  PulseDot,
  Actions,
  ActionBtn,
  Composer,
  ComposerFieldWrap,
  ComposerField,
  ComposerSave,
} from './CurrentlyReadingCard.styles';

interface CurrentlyReadingCardProps {
  title: string;
  author: string;
  coverUrl?: string;
  coverColor?: string;
  startedDate: string;
  onClick?: () => void;
  onLog?: (type: 'note' | 'quote', text: string) => void;
}

const PLACEHOLDERS: Record<'note' | 'quote', string> = {
  note: 'Capture a thought…',
  quote: 'Type a quote…',
};

/**
 * Compact card for a book currently in progress, displayed in the left panel of the library split
 * layout. Clicking the card navigates to the book detail page. The note and quote actions expand
 * inline into a contenteditable field for quick logging without leaving the library view — Enter
 * commits, Escape cancels. Logging is gated on the onLog callback being provided.
 */
export const CurrentlyReadingCard = ({
  title,
  author,
  coverUrl,
  coverColor = '#1a1a1a',
  startedDate,
  onClick,
  onLog,
}: CurrentlyReadingCardProps) => {
  const composer = useCardLogComposer(onLog);

  return (
    <Card $clickable={!!onClick} onClick={onClick}>
      <MainRow>
        <CoverThumb $color={coverColor}>
          {coverUrl && <CoverThumbImg src={coverUrl} alt={title} />}
        </CoverThumb>
        <Body>
          <Text variant="h6" as="h3">
            {title}
          </Text>
          <Text variant="ui-xs" color="muted">
            {author}
          </Text>
          <SinceRow>
            <PulseDot />
            <Text variant="ui-xs" color="muted">
              Since {startedDate}
            </Text>
          </SinceRow>
        </Body>
      </MainRow>
      {composer.openType ? (
        <Composer onClick={(e) => e.stopPropagation()}>
          <ComposerFieldWrap>
            <Text variant="ui-sm" as="div">
              <ComposerField
                ref={composer.inputRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder={PLACEHOLDERS[composer.openType]}
                onInput={composer.handleInput}
                onKeyDown={composer.handleKeyDown}
                onBlur={composer.handleBlur}
              />
            </Text>
          </ComposerFieldWrap>
          <ComposerSave
            type="button"
            $enabled={!composer.isEmpty}
            disabled={composer.isEmpty}
            onClick={composer.save}
            aria-label={`Save ${composer.openType}`}
          >
            <Icon icon="enter" size={15} />
          </ComposerSave>
        </Composer>
      ) : (
        <Actions>
          <ActionBtn
            title="Add note"
            aria-label="Add note"
            onClick={(e) => {
              e.stopPropagation();
              composer.open('note');
            }}
          >
            ✦
          </ActionBtn>
          <ActionBtn
            title="Add quote"
            aria-label="Add quote"
            onClick={(e) => {
              e.stopPropagation();
              composer.open('quote');
            }}
          >
            ❝
          </ActionBtn>
        </Actions>
      )}
    </Card>
  );
};

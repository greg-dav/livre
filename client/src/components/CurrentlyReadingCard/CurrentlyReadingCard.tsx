import { Text } from '@livre/primitives';
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
} from './CurrentlyReadingCard.styles';

interface CurrentlyReadingCardProps {
  title: string;
  author: string;
  coverUrl?: string;
  coverColor?: string;
  startedDate: string;
  onClick?: () => void;
}

/**
 * Compact card for a book currently in progress, displayed in the sticky left panel of the
 * library split layout. Clicking navigates to the book detail page. Action buttons are
 * decorative placeholders for note and quote logging, not yet wired to routes.
 */
export const CurrentlyReadingCard = ({
  title,
  author,
  coverUrl,
  coverColor = '#1a1a1a',
  startedDate,
  onClick,
}: CurrentlyReadingCardProps) => (
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
    <Actions>
      <ActionBtn title="Add note" onClick={(e) => e.stopPropagation()} aria-label="Add note">
        ✦
      </ActionBtn>
      <ActionBtn title="Add quote" onClick={(e) => e.stopPropagation()} aria-label="Add quote">
        ❝
      </ActionBtn>
    </Actions>
  </Card>
);

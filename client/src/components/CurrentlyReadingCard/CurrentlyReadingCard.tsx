import { Text, ProgressBar } from '@livre/primitives';
import {
  Card,
  CoverThumb,
  CoverThumbImg,
  Body,
  ProgressSection,
  LogButton,
} from './CurrentlyReadingCard.styles';

interface CurrentlyReadingCardProps {
  title: string;
  author: string;
  coverUrl?: string;
  coverColor?: string;
  progress?: number;
  startedDate: string;
  onLog?: () => void;
  onClick?: () => void;
}

/**
 * Prominent card for the book currently in progress. Designed to sit above the shelf grid as a
 * focal point, not inside it. The log button is the primary call-to-action for recording a
 * reading session — keep it wired to the log route, not to local UI state.
 */
export const CurrentlyReadingCard = ({
  title,
  author,
  coverUrl,
  coverColor = '#1a1a1a',
  progress,
  startedDate,
  onLog,
  onClick,
}: CurrentlyReadingCardProps) => (
  <Card $clickable={!!onClick} onClick={onClick}>
    <CoverThumb $color={coverColor}>
      {coverUrl && <CoverThumbImg src={coverUrl} alt={title} />}
    </CoverThumb>
    <Body>
      <Text variant="label" color="accent">
        Currently Reading
      </Text>
      <Text variant="h3" as="h2">
        {title}
      </Text>
      <Text variant="ui-md" color="muted">
        {author}
      </Text>
      <ProgressSection>
        {progress !== undefined && <ProgressBar value={progress} />}
        <Text variant="ui-sm" color="muted">
          Started {startedDate}
        </Text>
      </ProgressSection>
    </Body>
    {onLog && (
      <LogButton
        onClick={(e) => {
          e.stopPropagation();
          onLog();
        }}
        aria-label="Log progress"
      >
        +
      </LogButton>
    )}
  </Card>
);

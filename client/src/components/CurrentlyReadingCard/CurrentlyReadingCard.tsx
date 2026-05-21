import { Text, ProgressBar } from '@livre/primitives';
import { Card, CoverThumb, Body, ProgressSection, LogButton } from './CurrentlyReadingCard.styles';

interface CurrentlyReadingCardProps {
  title: string;
  author: string;
  coverColor?: string;
  progress: number;
  startedDate: string;
  onLog?: () => void;
}

const CurrentlyReadingCard = ({
  title,
  author,
  coverColor = '#1a1a1a',
  progress,
  startedDate,
  onLog,
}: CurrentlyReadingCardProps) => (
  <Card>
    <CoverThumb $color={coverColor} />
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
        <ProgressBar value={progress} />
        <Text variant="ui-sm" color="muted">
          Started {startedDate}
        </Text>
      </ProgressSection>
    </Body>
    <LogButton onClick={onLog} aria-label="Log progress">
      +
    </LogButton>
  </Card>
);

export default CurrentlyReadingCard;

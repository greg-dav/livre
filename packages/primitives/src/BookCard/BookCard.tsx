import Text from '../Text/Text';
import StarRating from '../StarRating/StarRating';
import { Card, Cover, FaceImage, Face, Meta } from './BookCard.styles';

export interface BookCardProps {
  title: string;
  author: string;
  coverUrl?: string;
  coverColor?: string;
  rating?: number;
  pageCount?: number;
  onClick?: () => void;
}

const BookCard = ({
  title,
  author,
  coverUrl,
  coverColor = '#2a2a2a',
  rating,
  onClick,
}: BookCardProps) => (
  <Card onClick={onClick}>
    <Cover $color={coverColor}>
      {coverUrl ? (
        <FaceImage src={coverUrl} alt={title} />
      ) : (
        <Face>
          <Text variant="body2" color="onColor">
            {title}
          </Text>
          <Text variant="ui-xs" color="onColorMuted">
            {author}
          </Text>
        </Face>
      )}
    </Cover>
    <Meta>
      <Text variant="h6" as="p">
        {title}
      </Text>
      <Text variant="ui-sm" color="muted">
        {author}
      </Text>
      {rating !== undefined && <StarRating value={rating} />}
    </Meta>
  </Card>
);

export default BookCard;

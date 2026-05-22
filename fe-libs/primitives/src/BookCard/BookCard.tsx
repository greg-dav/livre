import { useState, useEffect } from 'react';
import { Text } from '../Text/Text';
import { StarRating } from '../StarRating/StarRating';
import { Card, Cover, FaceImage, Face, Meta, BookGrid } from './BookCard.styles';

export { BookGrid };

export interface BookCardProps {
  title: string;
  author: string;
  coverUrl?: string;
  coverColor?: string;
  rating?: number;
  onClick?: () => void;
}

/**
 * The standard unit of the book grid. Renders a cover image when available, falling back to a
 * styled "face" showing title and author on a solid color background. Handles image load errors
 * gracefully — broken cover URLs fall back to the face rather than showing a broken image.
 * Designed for grid layouts with a fixed column width — not suited for list rows or detail views.
 */
export const BookCard = ({
  title,
  author,
  coverUrl,
  coverColor = '#2a2a2a',
  rating,
  onClick,
}: BookCardProps) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state if the cover URL changes (e.g. query results update)
  useEffect(() => {
    setImgError(false);
  }, [coverUrl]);

  return (
    <Card onClick={onClick}>
      <Cover $color={coverColor}>
        {coverUrl && !imgError ? (
          <FaceImage src={coverUrl} alt={title} onError={() => setImgError(true)} />
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
};

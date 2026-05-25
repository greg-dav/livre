import { useState, useEffect, useRef } from 'react';
import { Text } from '../Text/Text';
import { StarRating } from '../StarRating/StarRating';
import { Card, Cover, FaceImage, Face, Meta, BookGrid, Spine } from './BookCard.styles';

export { BookGrid };

export interface BookCardProps {
  title: string;
  author: string;
  coverUrl?: string;
  coverColor?: string;
  rating?: number;
  inLibrary?: boolean;
  /** When provided, shows as vertical text along the cover spine on hover. */
  spineLabel?: string;
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
  inLibrary,
  spineLabel,
  onClick,
}: BookCardProps) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
    // Cached images fire load before React attaches onLoad — check complete to catch them
    if (imgRef.current?.complete) setImgLoaded(true);
  }, [coverUrl]);

  return (
    <Card onClick={onClick}>
      <Cover $color={coverColor} $inLibrary={inLibrary}>
        {coverUrl && !imgError ? (
          <FaceImage
            ref={imgRef}
            src={coverUrl}
            alt={title}
            $loaded={imgLoaded}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
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
        {spineLabel && (
          <Spine>
            <Text variant="label" color="onColor">
              {spineLabel}
            </Text>
          </Spine>
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

import { Row, Star } from './StarRating.styles';

interface StarRatingProps {
  value: number;
  max?: number;
}

/**
 * StarRating
 *
 * Read-only star display for book ratings.
 * Renders filled (★) and empty (★, dimmed) glyphs from 1–max.
 *
 * @param value - Number of filled stars.
 * @param max   - Total stars to render. Defaults to 5.
 *
 * @example
 * <StarRating value={4} />     // ★★★★☆
 * <StarRating value={0} />     // ☆☆☆☆☆
 */
export const StarRating = ({ value, max = 5 }: StarRatingProps) => (
  <Row>
    {Array.from({ length: max }, (_, i) => (
      <Star key={i} $filled={i < value}>
        ★
      </Star>
    ))}
  </Row>
);

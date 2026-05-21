import { Row, Star } from './StarRating.styles';

interface StarRatingProps {
  value: number;
  max?: number;
}

/**
 * Display-only star rating. Use this instead of raw ★ glyphs to guarantee consistent sizing,
 * spacing, and the filled/empty color semantics from the theme. Not interactive — if you need
 * an input, build a separate RatingInput component rather than adding click handling here.
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

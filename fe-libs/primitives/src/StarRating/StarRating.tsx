import { Row, Star } from './StarRating.styles';

interface StarRatingProps {
  value: number;
  max?: number;
}

const getFill = (starIndex: number, value: number): 'full' | 'half' | 'empty' => {
  const starNum = starIndex + 1;
  if (value >= starNum) return 'full';
  if (value >= starNum - 0.5) return 'half';
  return 'empty';
};

/**
 * Display-only star rating with half-star precision. Use this instead of raw ★ glyphs to
 * guarantee consistent sizing, spacing, and the filled/empty color semantics from the theme.
 * Not interactive — if you need an input, use RatingInput instead.
 */
export const StarRating = ({ value, max = 5 }: StarRatingProps) => (
  <Row>
    {Array.from({ length: max }, (_, i) => (
      <Star key={i} $fill={getFill(i, value)}>
        ★
      </Star>
    ))}
  </Row>
);

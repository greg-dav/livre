import { useState } from 'react';
import { Row, StarWrapper, StarGlyph, HalfButton } from './RatingInput.styles';

interface RatingInputProps {
  value: number;
  max?: number;
  onChange: (rating: number) => void;
}

type Fill = 'full' | 'half' | 'empty';

const getFill = (starIndex: number, displayValue: number): Fill => {
  const starNum = starIndex + 1;
  if (displayValue >= starNum) return 'full';
  if (displayValue >= starNum - 0.5) return 'half';
  return 'empty';
};

/**
 * Interactive half-star rating input. Min selectable value is 1.0 (not 0.5), max is `max` (default 5),
 * step is 0.5. Clicking the active value clears the rating (calls onChange(0)). Hover previews
 * the prospective value. The left half of each star selects `n - 0.5` (min 1), the right half
 * selects `n`.
 */
export const RatingInput = ({ value, max = 5, onChange }: RatingInputProps) => {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  return (
    <Row onMouseLeave={() => setHoverValue(0)}>
      {Array.from({ length: max }, (_, i) => {
        const starNum = i + 1;
        const leftValue = Math.max(1, starNum - 0.5);
        const rightValue = starNum;

        return (
          <StarWrapper key={i}>
            <StarGlyph $fill={getFill(i, displayValue)}>★</StarGlyph>
            <HalfButton
              $side="left"
              type="button"
              aria-label={`${leftValue} stars`}
              onMouseEnter={() => setHoverValue(leftValue)}
              onClick={() => onChange(value === leftValue ? 0 : leftValue)}
            />
            <HalfButton
              $side="right"
              type="button"
              aria-label={`${rightValue} stars`}
              onMouseEnter={() => setHoverValue(rightValue)}
              onClick={() => onChange(value === rightValue ? 0 : rightValue)}
            />
          </StarWrapper>
        );
      })}
    </Row>
  );
};

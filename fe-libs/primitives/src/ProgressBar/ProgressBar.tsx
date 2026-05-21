import { Track, Fill } from './ProgressBar.styles';

interface ProgressBarProps {
  value: number;
}

/**
 * Thin reading-progress indicator. Value is clamped internally to [0, 100], so callers don't need
 * to guard against out-of-range percentages. Sized to sit inline with `ui-sm` text in a progress
 * section — don't use it as a standalone full-width element.
 */
export const ProgressBar = ({ value }: ProgressBarProps) => (
  <Track>
    <Fill $value={value} />
  </Track>
);

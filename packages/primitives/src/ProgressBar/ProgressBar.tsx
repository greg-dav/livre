import { Track, Fill } from './ProgressBar.styles';

interface ProgressBarProps {
  value: number;
}

/**
 * ProgressBar
 *
 * Thin horizontal bar representing a completion percentage.
 * Value is clamped to [0, 100] — no need to guard upstream.
 *
 * @param value - Percentage complete, 0–100.
 *
 * @example
 * <ProgressBar value={42} />
 */
const ProgressBar = ({ value }: ProgressBarProps) => (
  <Track>
    <Fill $value={value} />
  </Track>
);

export default ProgressBar;

import { Track, Fill, IndeterminateFill, ProgressKeyframes } from './ProgressBar.styles';

interface ProgressBarProps {
  value?: number;
}

/**
 * Thin progress indicator. With a `value` it's determinate (clamped internally to [0, 100], so
 * callers don't guard against out-of-range percentages) — used inline with `ui-sm` text in a
 * reading-progress section. Omit `value` for an indeterminate sweep, for operations whose progress
 * can't be measured (a network round-trip such as a library import/export).
 */
export const ProgressBar = ({ value }: ProgressBarProps) => {
  if (value === undefined) {
    return (
      <>
        <ProgressKeyframes />
        <Track>
          <IndeterminateFill />
        </Track>
      </>
    );
  }

  return (
    <Track>
      <Fill $value={value} />
    </Track>
  );
};

import { Text, type TextVariant } from '../Text/Text';
import { AccentPeriod } from './Logo.styles';

export type LogoSize = 'small' | 'medium' | 'large';

export interface LogoProps {
  size?: LogoSize;
}

const sizeVariant: Record<LogoSize, TextVariant> = {
  small: 'h4',
  medium: 'h2',
  large: 'h1',
};

/**
 * Renders the Livre wordmark — "livre" followed by a period in the accent color. Always use this
 * instead of a raw <Text> so the accent period is never accidentally omitted. Renders as a <span>
 * so it sits inline without introducing heading semantics.
 */
export const Logo = ({ size = 'medium' }: LogoProps) => (
  <Text variant={sizeVariant[size]} as="span">
    livre<AccentPeriod>.</AccentPeriod>
  </Text>
);

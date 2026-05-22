import { type TextVariant } from '../Text/Text';
import { Text } from '../Text/Text';
import { AccentPeriod, Wordmark } from './Logo.styles';
import { useNavigate } from 'react-router-dom';

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
export const Logo = ({ size = 'medium' }: LogoProps) => {
  const navigate = useNavigate();

  return (
    <Wordmark onClick={() => navigate('/')}>
      <Text variant={sizeVariant[size]} as="span">
        livre<AccentPeriod>.</AccentPeriod>
      </Text>
    </Wordmark>
  );
};

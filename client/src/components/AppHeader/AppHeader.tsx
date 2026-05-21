/**
 * Persistent app bar showing the wordmark and global actions. Keep actions here minimal and
 * app-scoped — this is not a contextual toolbar. Page-specific actions belong on the screen,
 * not here.
 */

import { Text } from '@livre/primitives';
import { Header, WordmarkDot, Actions, IconButton } from './AppHeader.styles';

interface AppHeaderProps {
  onToggleTheme?: () => void;
}

export const AppHeader = ({ onToggleTheme }: AppHeaderProps) => (
  <Header>
    <Text variant="h2" as="span">
      livre<WordmarkDot>.</WordmarkDot>
    </Text>
    <Actions>
      <IconButton aria-label="Add book">+</IconButton>
      <IconButton aria-label="Toggle theme" onClick={onToggleTheme}>
        ◐
      </IconButton>
    </Actions>
  </Header>
);

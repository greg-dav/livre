import { Logo } from '@livre/primitives';
import { Header, Actions, IconButton } from './AppHeader.styles';

interface AppHeaderProps {
  onToggleTheme?: () => void;
}

/**
 * Persistent app bar showing the wordmark and global actions. Keep actions here minimal and
 * app-scoped — this is not a contextual toolbar. Page-specific actions belong on the screen,
 * not here.
 */
export const AppHeader = ({ onToggleTheme }: AppHeaderProps) => (
  <Header>
    <Logo />
    <Actions>
      <IconButton aria-label="Add book">+</IconButton>
      <IconButton aria-label="Toggle theme" onClick={onToggleTheme}>
        ◐
      </IconButton>
    </Actions>
  </Header>
);

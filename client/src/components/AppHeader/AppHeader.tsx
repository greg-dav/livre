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

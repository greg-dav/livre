import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Text } from '@livre/primitives';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Trigger, Content, Item, Separator } from './UserMenu.styles';

/**
 * Avatar button that opens a dropdown with app-scoped user actions. Reads auth and theme state
 * directly since it's always rendered in an authenticated context. Sits at the top level of every
 * authenticated screen — page-specific actions belong on the screen itself, not here.
 */
export const UserMenu = () => {
  const { user, logout } = useAuth();
  const { toggleTheme } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Trigger aria-label="User menu">
          <Text variant="ui-sm" color="muted">
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </Trigger>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <Content align="end" sideOffset={8}>
          <Item disabled>
            <Text variant="ui-sm" color="muted">
              {user?.username}
            </Text>
          </Item>
          <Separator />
          <Item onSelect={toggleTheme}>
            <Text variant="ui-sm">Toggle theme</Text>
          </Item>
          <Separator />
          <Item onSelect={logout}>
            <Text variant="ui-sm">Sign out</Text>
          </Item>
        </Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

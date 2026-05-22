import { Text, DropdownMenu } from '@livre/primitives';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Trigger } from './UserMenu.styles';

/**
 * Avatar button that opens a dropdown with app-scoped user actions. Reads auth and theme state
 * directly since it's always rendered in an authenticated context. Sits at the top level of every
 * authenticated screen — page-specific actions belong on the screen itself, not here.
 */
export const UserMenu = () => {
  const { user, logout } = useAuth();
  const { toggleTheme } = useTheme();

  return (
    <DropdownMenu
      trigger={
        <Trigger aria-label="User menu">
          <Text variant="ui-sm" color="muted">
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </Trigger>
      }
      align="end"
      sideOffset={8}
    >
      <DropdownMenu.Item disabled>
        <Text variant="ui-sm" color="muted">
          {user?.username}
        </Text>
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onSelect={toggleTheme}>
        <Text variant="ui-sm">Toggle theme</Text>
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onSelect={logout}>
        <Text variant="ui-sm">Sign out</Text>
      </DropdownMenu.Item>
    </DropdownMenu>
  );
};

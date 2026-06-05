import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, Logo, Text } from '@livre/primitives';
import { useAuth } from '../../context/AuthContext';
import { PRIMARY, SETTINGS, isActive, type NavItem } from '../utils/navItems';
import { Nav, WordmarkRail, Spacer, Item, Tip } from './Sidebar.styles';

/**
 * Persistent left navigation rail, shown on desktop only (hidden below the mobile breakpoint, where
 * BottomNav takes over). Icon-only by design — labels surface as hover tooltips so the rail stays
 * slim. Active state is derived from the current path prefix so nested routes (a library book, an
 * author page) keep their section highlighted. Settings and the sign-out action are pinned to the
 * foot; there is no separate account menu.
 */
export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const renderItem = ({ to, label, icon }: NavItem) => (
    <Item
      key={to}
      $active={isActive(location.pathname, to)}
      onClick={() => navigate(to)}
      aria-label={label}
    >
      <Icon icon={icon} />
      <Tip data-tip>
        <Text variant="ui-xs" color="default">
          {label}
        </Text>
      </Tip>
    </Item>
  );

  return (
    <Nav>
      <WordmarkRail>
        <Logo size="xsmall" />
      </WordmarkRail>
      {PRIMARY.map(renderItem)}
      <Spacer />
      {renderItem(SETTINGS)}
      <Item onClick={logout} aria-label="Sign out">
        <Icon icon="logout" />
        <Tip data-tip>
          <Text variant="ui-xs" color="default">
            Sign out
          </Text>
        </Tip>
      </Item>
    </Nav>
  );
};

import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName, Logo, Text } from '@livre/primitives';
import { Nav, WordmarkRail, Spacer, Item, Tip } from './Sidebar.styles';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

const PRIMARY: NavItem[] = [
  { to: '/library', label: 'Library', icon: 'library' },
  { to: '/log', label: 'Log', icon: 'log' },
  { to: '/search', label: 'Search', icon: 'search' },
];

const SETTINGS: NavItem = { to: '/settings', label: 'Settings', icon: 'settings' };

/**
 * Persistent left navigation rail and the app's only nav chrome. Icon-only by design — labels
 * surface as hover tooltips so the rail stays slim. Active state is derived from the current path
 * prefix so nested routes (a library book, an author page) keep their section highlighted.
 * Settings is pinned to the foot; the account menu lives in the global header, not here.
 */
export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  const renderItem = ({ to, label, icon }: NavItem) => (
    <Item key={to} $active={isActive(to)} onClick={() => navigate(to)} aria-label={label}>
      <Icon icon={icon} />
      <Tip data-tip>
        <Text variant="ui-xs" color="onColor">
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
    </Nav>
  );
};

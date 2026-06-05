import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, Text } from '@livre/primitives';
import { PRIMARY, SETTINGS, isActive, type NavItem } from '../utils/navItems';
import { Bar, Tab } from './BottomNav.styles';

const TABS: NavItem[] = [...PRIMARY, SETTINGS];

/**
 * Mobile bottom tab bar — the phone counterpart to the desktop Sidebar rail, shown only below the
 * mobile breakpoint. Carries the four primary destinations (sign-out lives in Settings on mobile,
 * not here). Active state mirrors the rail via the shared path-prefix helper so the two stay in sync.
 */
export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Bar>
      {TABS.map(({ to, label, icon }) => {
        const active = isActive(location.pathname, to);
        return (
          <Tab key={to} $active={active} onClick={() => navigate(to)} aria-label={label}>
            <Icon icon={icon} />
            <Text variant="ui-xs" color={active ? 'accent' : 'muted'}>
              {label}
            </Text>
          </Tab>
        );
      })}
    </Bar>
  );
};

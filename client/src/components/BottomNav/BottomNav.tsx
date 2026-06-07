import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, Text } from '@livre/primitives';
import { PRIMARY, SETTINGS, isActive, type NavItem } from '../utils/navItems';
import { Bar, Tab } from './BottomNav.styles';

const TABS: NavItem[] = [...PRIMARY, SETTINGS];

/**
 * Mobile bottom tab bar — the phone counterpart to the desktop Sidebar rail, shown only below the
 * mobile breakpoint. Carries the four primary destinations (sign-out lives in Settings on mobile,
 * not here). Active state mirrors the rail via the shared path-prefix helper so the two stay in sync.
 *
 * Rendered through a portal into <body>, not in the Layout tree, to keep its fixed positioning out
 * of the shell's `overflow: hidden` / `height: 100dvh` container, which otherwise interferes with
 * fixed elements (and their recalculation) in an iOS standalone PWA. The bar still bottoms out at
 * the standalone layout viewport's edge — which excludes the home-indicator inset — so the strip
 * below it is covered by the body's bgElevated background rather than by the bar itself.
 */
export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return createPortal(
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
    </Bar>,
    document.body
  );
};

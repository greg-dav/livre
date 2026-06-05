import type { IconName } from '@livre/primitives';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

// The primary destinations, shared by the desktop rail (Sidebar) and the mobile bar (BottomNav) so
// the two can never drift. Sign-out is deliberately absent here — it's a desktop rail-only action;
// on mobile it lives in the Settings screen.
export const PRIMARY: NavItem[] = [
  { to: '/library', label: 'Library', icon: 'library' },
  { to: '/log', label: 'Log', icon: 'log' },
  { to: '/search', label: 'Search', icon: 'search' },
];

export const SETTINGS: NavItem = { to: '/settings', label: 'Settings', icon: 'settings' };

// Active when the path is the destination or nested beneath it, so a library book or author page
// keeps its section highlighted.
export const isActive = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`);

import {
  Book,
  Check,
  ChevronDown,
  CornerDownLeft,
  Database,
  Download,
  Headphones,
  Library,
  LogOut,
  NotebookPen,
  Palette,
  Pencil,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Tablet,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

/**
 * The single allowlist mapping semantic names → Lucide glyphs. Lucide is imported here and
 * nowhere else in the codebase; every icon the app uses must be registered below, which makes
 * `IconName` the exhaustive, type-checked set of available icons.
 */
const ICONS = {
  library: Library,
  log: NotebookPen,
  enter: CornerDownLeft,
  search: Search,
  settings: Settings,
  book: Book,
  tablet: Tablet,
  headphones: Headphones,
  account: User,
  users: Users,
  appearance: Palette,
  config: SlidersHorizontal,
  logout: LogOut,
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  download: Download,
  data: Database,
  check: Check,
  'chevron-down': ChevronDown,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  icon: IconName;
  size?: number;
  strokeWidth?: number;
}

/**
 * Sole entry point for vector icons. Wraps Lucide behind a fixed allowlist so call sites reference
 * icons by semantic name (icon="library") and never import Lucide directly — keeping the icon set
 * curated and swappable. Inherits color from `currentColor`; size and stroke default to the app's
 * standard 18px / 1.5 weight.
 */
export const Icon = ({ icon, size = 18, strokeWidth = 1.5 }: IconProps) => {
  const Glyph = ICONS[icon];
  return <Glyph size={size} strokeWidth={strokeWidth} />;
};

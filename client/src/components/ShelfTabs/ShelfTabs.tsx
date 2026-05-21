/**
 * Filters the book grid by shelf status. Purely presentational — active state and counts come
 * from the parent so this component stays in sync with the data layer without owning any state
 * itself.
 */

import { Text } from '@livre/primitives';
import { TabRow, Tab, Badge } from './ShelfTabs.styles';

export type ShelfStatus = 'read' | 'want' | 'dnf';

interface ShelfTabsProps {
  active: ShelfStatus;
  counts: Record<ShelfStatus, number>;
  onChange: (status: ShelfStatus) => void;
}

const TABS: { id: ShelfStatus; label: string }[] = [
  { id: 'read', label: 'Read' },
  { id: 'want', label: 'Want' },
  { id: 'dnf', label: 'DNF' },
];

export const ShelfTabs = ({ active, counts, onChange }: ShelfTabsProps) => (
  <TabRow>
    {TABS.map(({ id, label }) => (
      <Tab key={id} $active={active === id} onClick={() => onChange(id)}>
        <Text variant="label" color={active === id ? 'default' : 'muted'}>
          {label}
        </Text>
        <Badge>
          <Text variant="ui-xs" color={active === id ? 'default' : 'muted'}>
            {counts[id]}
          </Text>
        </Badge>
      </Tab>
    ))}
  </TabRow>
);

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
  { id: 'want', label: 'Want to Read' },
  { id: 'dnf', label: 'Did Not Finish' },
];

/**
 * Filters the book grid by shelf status. Purely presentational — active state and counts come
 * from the parent so this component stays in sync with the data layer without owning any state
 * itself.
 */
export const ShelfTabs = ({ active, counts, onChange }: ShelfTabsProps) => (
  <TabRow>
    {TABS.map(({ id, label }) => (
      <Tab key={id} $active={active === id} onClick={() => onChange(id)}>
        <Text variant="ui-md" color={active === id ? 'default' : 'muted'}>
          {label}
        </Text>
        <Badge $active={active === id}>
          <Text as="span" variant="label" color={active === id ? 'accent' : 'muted'}>
            {counts[id]}
          </Text>
        </Badge>
      </Tab>
    ))}
  </TabRow>
);

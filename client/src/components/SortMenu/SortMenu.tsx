import { searchSortSchema, type SearchSort } from '@livre/types';
import { DropdownMenu, Text } from '@livre/primitives';
import { SORT_LABELS } from '../../lib/search';
import { SortButton } from './SortMenu.styles';

interface SortMenuProps {
  value: SearchSort;
  onChange: (sort: SearchSort) => void;
}

/**
 * The "Sort: … ▾" control shared by the Search and Author result grids. Purely presentational — it
 * reads the sort vocabulary and reports selections up, so both screens order results the same way
 * without duplicating the menu.
 */
export const SortMenu = ({ value, onChange }: SortMenuProps) => (
  <DropdownMenu
    align="end"
    trigger={
      <SortButton>
        <Text className="sort-label" variant="ui-sm">
          Sort: {SORT_LABELS[value]} ▾
        </Text>
      </SortButton>
    }
  >
    {searchSortSchema.options.map((key) => (
      <DropdownMenu.Item key={key} onSelect={() => onChange(key)}>
        <Text variant="ui-sm" color={key === value ? 'accent' : 'default'}>
          {SORT_LABELS[key]}
        </Text>
      </DropdownMenu.Item>
    ))}
  </DropdownMenu>
);

export type { SortMenuProps };

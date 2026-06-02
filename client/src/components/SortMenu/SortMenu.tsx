import { DropdownMenu, Text } from '@livre/primitives';
import { SortButton } from './SortMenu.styles';

interface SortMenuProps<T extends string> {
  value: T;
  onChange: (sort: T) => void;
  options: readonly T[];
  labels: Record<T, string>;
}

/**
 * The "Sort: … ▾" control shared by every result grid. Purely presentational and generic over the
 * sort vocabulary, so the Search, Author, and Library screens order their grids the same way without
 * duplicating the menu — each supplies its own option keys and labels.
 */
export const SortMenu = <T extends string>({
  value,
  onChange,
  options,
  labels,
}: SortMenuProps<T>) => (
  <DropdownMenu
    align="end"
    trigger={
      <SortButton>
        <Text className="sort-label" variant="ui-sm">
          Sort: {labels[value]} ▾
        </Text>
      </SortButton>
    }
  >
    {options.map((key) => (
      <DropdownMenu.Item key={key} onSelect={() => onChange(key)}>
        <Text variant="ui-sm" color={key === value ? 'accent' : 'default'}>
          {labels[key]}
        </Text>
      </DropdownMenu.Item>
    ))}
  </DropdownMenu>
);

export type { SortMenuProps };

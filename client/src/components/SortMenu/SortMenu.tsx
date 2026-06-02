import { Popover, Text, Icon } from '@livre/primitives';
import { SortButton } from './SortMenu.styles';

interface SortMenuProps<T extends string> {
  value: T;
  onChange: (sort: T) => void;
  options: readonly T[];
  labels: Record<T, string>;
}

/**
 * The "Sort: …" control shared by every result grid. Purely presentational and generic over the
 * sort vocabulary, so the Search, Author, and Library screens order their grids the same way without
 * duplicating the menu — each supplies its own option keys and labels.
 */
export const SortMenu = <T extends string>({
  value,
  onChange,
  options,
  labels,
}: SortMenuProps<T>) => (
  <Popover
    align="end"
    side="bottom"
    trigger={
      <SortButton>
        <Text className="sort-label" variant="ui-sm">
          Sort: {labels[value]}
        </Text>
        <Icon icon="chevron-down" size={14} />
      </SortButton>
    }
  >
    <Popover.Panel>
      {options.map((key) => (
        <Popover.Item key={key} active={key === value} onSelect={() => onChange(key)}>
          <Text className="menu-label" variant="ui-sm">
            {labels[key]}
          </Text>
        </Popover.Item>
      ))}
    </Popover.Panel>
  </Popover>
);

export type { SortMenuProps };

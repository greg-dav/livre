import { Icon, Text } from '@livre/primitives';
import {
  FacetList,
  FacetRow,
  FacetTick,
  FacetName,
  FacetCount,
  ClearButton,
} from './TagFacet.styles';

export interface TagFacetOption {
  tag: string;
  count: number;
}

interface TagFacetProps {
  options: TagFacetOption[];
  selected: ReadonlySet<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
}

/**
 * Multi-select tag facet for the library left panel. Each tag combines with OR to broaden the
 * shelf grid. Counts and the option set are scoped to the active shelf by the parent, so a tag
 * absent from the current shelf dims out unless it's still selected (so it stays deselectable).
 * Purely presentational — selection state lives in the screen so it persists across tab switches.
 */
export const TagFacet = ({ options, selected, onToggle, onClear }: TagFacetProps) => (
  <FacetList>
    {options.map(({ tag, count }) => {
      const active = selected.has(tag);
      return (
        <FacetRow
          key={tag}
          $active={active}
          $disabled={count === 0 && !active}
          onClick={() => onToggle(tag)}
        >
          <FacetTick $active={active}>{active && <Icon icon="check" size={10} />}</FacetTick>
          <FacetName>
            <Text className="facet-name" variant="ui-tight">
              {tag}
            </Text>
          </FacetName>
          <FacetCount>
            <Text variant="ui-xs" color="muted">
              {count}
            </Text>
          </FacetCount>
        </FacetRow>
      );
    })}
    {selected.size > 0 && (
      <ClearButton onClick={onClear}>
        <Text className="clear-label" variant="ui-xs">
          Clear tags
        </Text>
      </ClearButton>
    )}
  </FacetList>
);

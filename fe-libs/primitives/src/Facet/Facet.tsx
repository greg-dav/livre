import { type KeyboardEvent, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { Text } from '../Text/Text';
import {
  FacetList,
  FacetRow,
  FacetTick,
  FacetName,
  FacetCount,
  FacetClear,
  FacetSeparator,
  FacetSearchField,
  FacetSearchInput,
  FacetSearchGhost,
} from './Facet.styles';

interface FacetItemProps {
  label: string;
  /** Omit for facets that don't carry a count (e.g. a radio scope). */
  count?: number;
  active: boolean;
  /** Round tick + single-select semantics, vs the default square multi-select tick. */
  radio?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

const Item = ({ label, count, active, radio, disabled, onSelect }: FacetItemProps) => (
  <FacetRow $active={active} $radio={radio} $disabled={disabled} onClick={onSelect}>
    <FacetTick $active={active} $radio={radio}>
      {active && <Icon icon="check" size={radio ? 9 : 10} />}
    </FacetTick>
    <FacetName>
      <Text className="facet-name" variant="ui-tight">
        {label}
      </Text>
    </FacetName>
    {count !== undefined && (
      <FacetCount>
        <Text variant="ui-xs" color="muted">
          {count}
        </Text>
      </FacetCount>
    )}
  </FacetRow>
);

interface FacetSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Candidate labels to inline-complete against; the prefix match is ghosted and accepted with Tab. */
  suggestions: string[];
  /** Fired with the resolved label when Enter is pressed on a match. */
  onSelect: (label: string) => void;
  placeholder?: string;
}

const firstPrefixMatch = (suggestions: string[], lower: string) =>
  lower === ''
    ? null
    : (suggestions.find((s) => s.toLowerCase().startsWith(lower) && s.toLowerCase() !== lower) ??
      null);

const Search = ({
  value,
  onChange,
  suggestions,
  onSelect,
  placeholder = 'Filter tags…',
}: FacetSearchProps) => {
  const lower = value.trim().toLowerCase();
  const match = firstPrefixMatch(suggestions, lower);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && match) {
      e.preventDefault();
      onChange(match);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const resolved = match ?? suggestions.find((s) => s.toLowerCase().startsWith(lower)) ?? null;
      if (resolved) {
        onSelect(resolved);
        onChange('');
      }
    }
    if (e.key === 'Escape') onChange('');
  };

  return (
    <FacetSearchField>
      <Text variant="ui-tight" as="div">
        {match && (
          <FacetSearchGhost aria-hidden>
            <span>{value}</span>
            {match.slice(value.length)}
          </FacetSearchGhost>
        )}
        <FacetSearchInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
      </Text>
    </FacetSearchField>
  );
};

interface FacetClearProps {
  children: ReactNode;
  onClick: () => void;
}

const Clear = ({ children, onClick }: FacetClearProps) => (
  <FacetClear onClick={onClick}>
    <Text className="clear-label" variant="ui-xs">
      {children}
    </Text>
  </FacetClear>
);

/**
 * Shared facet control for the library tag filter and the search refinement rail. `Facet.List` is
 * the container — a vertical list on desktop that collapses to a horizontal chip scroller on mobile
 * (pass `$bleed` when it sits inside a horizontally-padded parent so the track runs edge-to-edge).
 * `Facet.Item` renders one tick/label/count row (square multi-select tick by default, `radio` for a
 * round single-select). `Facet.Search` is an optional filter field above the list with inline
 * tab-to-complete against the available labels. `Facet.Separator` divides groups within the mobile
 * scroller; `Facet.Clear` is the reset affordance. Purely presentational — state lives in the screen.
 */
export const Facet = {
  List: FacetList,
  Item,
  Search,
  Separator: FacetSeparator,
  Clear,
};

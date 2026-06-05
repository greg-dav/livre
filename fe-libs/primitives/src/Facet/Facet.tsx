import { type ReactNode } from 'react';
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
 * round single-select). `Facet.Separator` divides groups within the mobile scroller; `Facet.Clear`
 * is the reset affordance. Purely presentational — selection state lives in the consuming screen.
 */
export const Facet = {
  List: FacetList,
  Item,
  Separator: FacetSeparator,
  Clear,
};

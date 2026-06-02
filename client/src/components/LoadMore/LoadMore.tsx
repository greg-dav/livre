import { Text } from '@livre/primitives';
import { LoadMoreRow, LoadMoreButton } from './LoadMore.styles';

interface LoadMoreProps {
  onClick: () => void;
  loading: boolean;
}

/**
 * Foot-of-grid "Load more" control for paginated result sets. The parent decides whether another
 * page exists (and only renders this when it does); this component just reports the click and
 * reflects the in-flight state so a double-tap can't fire two fetches.
 */
export const LoadMore = ({ onClick, loading }: LoadMoreProps) => (
  <LoadMoreRow>
    <LoadMoreButton onClick={onClick} disabled={loading}>
      <Text variant="ui-sm" color="muted">
        {loading ? 'Loading…' : 'Load more'}
      </Text>
    </LoadMoreButton>
  </LoadMoreRow>
);

export type { LoadMoreProps };

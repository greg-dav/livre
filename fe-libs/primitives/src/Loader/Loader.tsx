import { type ReactNode } from 'react';
import { Ring, Fill, Relative, Overlay, LoaderKeyframes } from './Loader.styles';

interface LoaderProps {
  loading?: boolean;
  children?: ReactNode;
}

/**
 * Replaces all loading text in the app. Without children, renders a centered spinner that
 * expands to fill available flex space — use for initial page or section load states. With
 * children, dims the content and overlays a spinner while loading — use when content already
 * exists and is being refreshed.
 */
export const Loader = ({ loading = true, children }: LoaderProps) => {
  if (!children) {
    return loading ? (
      <>
        <LoaderKeyframes />
        <Fill>
          <Ring />
        </Fill>
      </>
    ) : null;
  }

  return (
    <>
      <LoaderKeyframes />
      <Relative $loading={!!loading}>
        {children}
        {loading && (
          <Overlay>
            <Ring />
          </Overlay>
        )}
      </Relative>
    </>
  );
};

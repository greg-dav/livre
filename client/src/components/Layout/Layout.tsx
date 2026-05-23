import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { z } from 'zod';
import { Logo, Text } from '@livre/primitives';
import { BookSearch } from '../BookSearch/BookSearch';
import { UserMenu } from '../UserMenu/UserMenu';
import { Page, TopBar, Content, BackLink } from './Layout.styles';

interface LayoutProps {
  children: ReactNode;
}

const backStateSchema = z.discriminatedUnion('from', [
  z.object({ from: z.literal('library') }),
  z.object({ from: z.literal('author'), authorName: z.string() }),
]);

const getBackNav = (state: unknown): { label: string; to: string } => {
  const result = backStateSchema.safeParse(state);
  if (result.success && result.data.from === 'author') {
    return {
      label: `Back to Books by ${result.data.authorName}`,
      to: `/author/${encodeURIComponent(result.data.authorName)}`,
    };
  }
  return { label: 'Back to Library', to: '/' };
};

/**
 * Shell for every authenticated screen. Owns the persistent top bar so Logo, search, and the
 * user menu are never re-implemented per screen. Shows a context-aware back link on all pages
 * except the Library root. Wraps children in a centred, padded content column.
 */
export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isRoot = location.pathname === '/';
  const backNav = getBackNav(location.state);

  return (
    <Page>
      <TopBar>
        <Logo size="small" />
        <BookSearch />
        <UserMenu />
      </TopBar>
      <Content>
        {!isRoot && (
          <BackLink to={backNav.to}>
            <Text variant="ui-sm">← {backNav.label}</Text>
          </BackLink>
        )}
        {children}
      </Content>
    </Page>
  );
};

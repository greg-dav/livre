import { type ReactNode } from 'react';
import { Logo } from '@livre/primitives';
import { BookSearch } from '../BookSearch/BookSearch';
import { UserMenu } from '../UserMenu/UserMenu';
import { Page, TopBar, Content } from './Layout.styles';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Shell for every authenticated screen. Owns the persistent top bar so Logo, search, and the
 * user menu are never re-implemented per screen. Wraps children in a centred, padded content
 * column — screens that need a different content structure can ignore this and use their own.
 */
export const Layout = ({ children }: LayoutProps) => (
  <Page>
    <TopBar>
      <Logo size="small" />
      <BookSearch />
      <UserMenu />
    </TopBar>
    <Content>{children}</Content>
  </Page>
);

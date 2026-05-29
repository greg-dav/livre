import { type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Logo, Text } from '@livre/primitives';
import { BookSearch } from '../BookSearch/BookSearch';
import { UserMenu } from '../UserMenu/UserMenu';
import { Page, TopBar, Content, BackButton } from './Layout.styles';

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
  focusMode?: boolean;
}

const backLabelSchema = z.object({ backLabel: z.string() });

/**
 * Shell for every authenticated screen. Owns the persistent top bar so Logo, search, and the
 * user menu are never re-implemented per screen. Shows a context-aware back button on all pages
 * except the Library root — uses navigate(-1) so the browser history stack determines the
 * destination, with backLabel in navigation state supplying the display text. Wraps children in
 * a centred, padded content column.
 */
export const Layout = ({ children, fullWidth, focusMode }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = location.pathname === '/library' || location.pathname === '/';
  const backLabel = backLabelSchema.safeParse(location.state).data?.backLabel ?? 'Library';

  return (
    <Page>
      <TopBar>
        <Logo size="small" />
        <BookSearch />
        <UserMenu />
      </TopBar>
      <Content $fullWidth={fullWidth} $focusMode={focusMode}>
        {!isRoot && (
          <BackButton onClick={() => navigate(-1)}>
            <Text variant="ui-sm">← Back to {backLabel}</Text>
          </BackButton>
        )}
        {children}
      </Content>
    </Page>
  );
};

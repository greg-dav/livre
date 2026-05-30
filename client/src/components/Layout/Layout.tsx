import { type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Text } from '@livre/primitives';
import { Sidebar } from '../Sidebar/Sidebar';
import { BookSearch } from '../BookSearch/BookSearch';
import { UserMenu } from '../UserMenu/UserMenu';
import {
  Page,
  Main,
  Header,
  HeaderLeft,
  HeaderDivider,
  HeaderTitle,
  HeaderRight,
  SearchSlot,
  Body,
  Content,
  BackButton,
} from './Layout.styles';

// Top-level nav destinations reached from the rail — these never show a back affordance.
const ROOT_PATHS = new Set(['/', '/library', '/log', '/search', '/settings']);

interface LayoutProps {
  children: ReactNode;
  title?: string;
  fullWidth?: boolean;
  focusMode?: boolean;
}

const backLabelSchema = z.object({ backLabel: z.string() });

/**
 * Shell for every authenticated screen. Owns the persistent nav rail and the global header so
 * neither is re-implemented per screen. The shell is fixed-height (no window scroll); the body
 * scrolls internally, mirroring the prototype. The header carries a context-aware back button on
 * every page except the Library root — navigate(-1) lets browser history pick the destination,
 * with backLabel from navigation state supplying the label — plus the optional page title, the
 * quick-search, and the account menu.
 */
export const Layout = ({ children, title, fullWidth, focusMode }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = ROOT_PATHS.has(location.pathname);
  const backLabel = backLabelSchema.safeParse(location.state).data?.backLabel ?? 'Library';

  return (
    <Page>
      <Sidebar />
      <Main>
        <Header>
          <HeaderLeft>
            {!isRoot && (
              <BackButton onClick={() => navigate(-1)}>
                <Text variant="ui-sm">← Back to {backLabel}</Text>
              </BackButton>
            )}
            {!isRoot && title && <HeaderDivider />}
            {title && (
              <HeaderTitle>
                <Text variant="h5" as="span">
                  {title}
                </Text>
              </HeaderTitle>
            )}
          </HeaderLeft>
          <SearchSlot>
            <BookSearch />
          </SearchSlot>
          <HeaderRight>
            <UserMenu />
          </HeaderRight>
        </Header>
        <Body $fullWidth={fullWidth}>
          {fullWidth ? children : <Content $focusMode={focusMode}>{children}</Content>}
        </Body>
      </Main>
    </Page>
  );
};

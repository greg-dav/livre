import { type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Icon, Text } from '@livre/primitives';
import { Sidebar } from '../Sidebar/Sidebar';
import { BottomNav } from '../BottomNav/BottomNav';
import { BookSearch } from '../BookSearch/BookSearch';
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
  MobileContext,
  ContextBack,
  ContextCover,
  ContextText,
  ContextLine,
} from './Layout.styles';

// Top-level nav destinations reached from the rail — these never show a back affordance.
const ROOT_PATHS = new Set(['/', '/library', '/log', '/search', '/settings']);

interface LayoutProps {
  children: ReactNode;
  title?: string;
  fullWidth?: boolean;
  focusMode?: boolean;
  // Detail-page context shown in the mobile top bar beside the back chevron.
  coverUrl?: string;
  subtitle?: string;
}

const backLabelSchema = z.object({ backLabel: z.string() });

/**
 * Shell for every authenticated screen. Owns the persistent nav (the desktop rail / the mobile
 * bottom bar) and the global header so neither is re-implemented per screen. The shell is
 * fixed-height (no window scroll); the body scrolls internally. On non-root pages the header carries
 * a back affordance — navigate(-1) lets browser history pick the destination, with backLabel from
 * navigation state supplying the desktop label. On mobile that collapses to a compact contextual bar
 * (a slim chevron + optional cover thumbnail + title/subtitle), and the desktop back/title are
 * hidden; the browser's edge-swipe still works as a bonus. Account actions and sign-out live on the
 * nav, not here.
 */
export const Layout = ({
  children,
  title,
  fullWidth,
  focusMode,
  coverUrl,
  subtitle,
}: LayoutProps) => {
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
              <HeaderTitle $hideOnMobile={!isRoot}>
                <Text variant="h5" as="span">
                  {title}
                </Text>
              </HeaderTitle>
            )}
            {!isRoot && (
              <MobileContext>
                <ContextBack onClick={() => navigate(-1)} aria-label={`Back to ${backLabel}`}>
                  <Icon icon="chevron-left" size={24} />
                </ContextBack>
                {coverUrl && <ContextCover style={{ backgroundImage: `url(${coverUrl})` }} />}
                <ContextText>
                  {title && (
                    <ContextLine>
                      <Text variant="ui-sm">{title}</Text>
                    </ContextLine>
                  )}
                  {subtitle && (
                    <ContextLine>
                      <Text variant="ui-xs" color="muted">
                        {subtitle}
                      </Text>
                    </ContextLine>
                  )}
                </ContextText>
              </MobileContext>
            )}
          </HeaderLeft>
          <SearchSlot>
            <BookSearch />
          </SearchSlot>
          {/* Empty trailing track keeps the search centred in the header grid. */}
          <HeaderRight />
        </Header>
        <Body $fullWidth={fullWidth}>
          {fullWidth ? children : <Content $focusMode={focusMode}>{children}</Content>}
        </Body>
      </Main>
      <BottomNav />
    </Page>
  );
};

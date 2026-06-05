import { useState } from 'react';
import { Icon, type IconName, Text } from '@livre/primitives';
import { Layout } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { AccountSection } from './AccountSection';
import { DataSection } from './DataSection';
import { UsersSection } from './UsersSection';
import { AppearanceSection } from './AppearanceSection';
import { ConfigurationSection } from './ConfigurationSection';
import { DemoSection } from './DemoSection';
import {
  Split,
  NavPanel,
  NavHeader,
  NavGroupHeader,
  NavDivider,
  NavItem,
  ContentPanel,
  ContentInner,
} from './Settings.styles';

type SectionId = 'account' | 'data' | 'users' | 'appearance' | 'config' | 'demo';

interface SectionDef {
  id: SectionId;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
  render: () => React.ReactNode;
}

const SECTIONS: SectionDef[] = [
  { id: 'account', label: 'Account', icon: 'account', render: () => <AccountSection /> },
  { id: 'data', label: 'Data', icon: 'data', render: () => <DataSection /> },
  { id: 'users', label: 'Users', icon: 'users', adminOnly: true, render: () => <UsersSection /> },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: 'appearance',
    render: () => <AppearanceSection />,
  },
  {
    id: 'config',
    label: 'Configuration',
    icon: 'config',
    adminOnly: true,
    render: () => <ConfigurationSection />,
  },
  { id: 'demo', label: 'Demo', icon: 'enter', adminOnly: true, render: () => <DemoSection /> },
];

/**
 * Settings screen. Mirrors the Library's split layout: a fixed left rail of section actions and a
 * scrolling content panel for the selected section. The rail is split into the reader's own
 * settings and a separate Administration group (Users, Configuration); admin sections are dropped
 * for non-admins entirely, so the rail never offers something the server would reject.
 */
export const Settings = () => {
  const { user } = useAuth();
  const personalSections = SECTIONS.filter((s) => !s.adminOnly);
  const adminSections = user?.is_admin ? SECTIONS.filter((s) => s.adminOnly) : [];
  const visible = [...personalSections, ...adminSections];
  const [active, setActive] = useState<SectionId>('account');
  const current = visible.find((s) => s.id === active) ?? visible[0];

  const renderItem = (section: SectionDef) => (
    <NavItem
      key={section.id}
      $active={section.id === current.id}
      onClick={() => setActive(section.id)}
    >
      <Icon icon={section.icon} />
      <Text variant="ui-sm" color={section.id === current.id ? 'accent' : 'default'}>
        {section.label}
      </Text>
    </NavItem>
  );

  return (
    <Layout fullWidth title="Settings">
      <Split>
        <NavPanel>
          <NavHeader>
            <Text variant="label" color="accent">
              Settings
            </Text>
            <NavDivider />
          </NavHeader>
          {personalSections.map(renderItem)}
          {adminSections.length > 0 && (
            <>
              <NavGroupHeader>
                <Text variant="label" color="accent">
                  Administration
                </Text>
                <NavDivider />
              </NavGroupHeader>
              {adminSections.map(renderItem)}
            </>
          )}
        </NavPanel>
        <ContentPanel>
          <ContentInner>{current.render()}</ContentInner>
        </ContentPanel>
      </Split>
    </Layout>
  );
};

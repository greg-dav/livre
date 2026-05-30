import { useState } from 'react';
import { Icon, type IconName, Text } from '@livre/primitives';
import { Layout } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { AccountSection } from './AccountSection';
import { UsersSection } from './UsersSection';
import { AppearanceSection } from './AppearanceSection';
import { ConfigurationSection } from './ConfigurationSection';
import {
  Split,
  NavPanel,
  NavHeader,
  NavDivider,
  NavItem,
  ContentPanel,
  ContentInner,
} from './Settings.styles';

type SectionId = 'account' | 'users' | 'appearance' | 'config';

interface SectionDef {
  id: SectionId;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
  render: () => React.ReactNode;
}

const SECTIONS: SectionDef[] = [
  { id: 'account', label: 'Account', icon: 'account', render: () => <AccountSection /> },
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
];

/**
 * Settings screen. Mirrors the Library's split layout: a fixed left rail of section actions and a
 * scrolling content panel for the selected section. Admin-only sections (Users, Configuration) are
 * filtered out for non-admins entirely, so the rail never offers something the server would reject.
 */
export const Settings = () => {
  const { user } = useAuth();
  const sections = SECTIONS.filter((s) => !s.adminOnly || user?.is_admin);
  const [active, setActive] = useState<SectionId>('account');
  const current = sections.find((s) => s.id === active) ?? sections[0];

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
          {sections.map((section) => (
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
          ))}
        </NavPanel>
        <ContentPanel>
          <ContentInner>{current.render()}</ContentInner>
        </ContentPanel>
      </Split>
    </Layout>
  );
};

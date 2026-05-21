import { Text } from '@livre/primitives';
import { Bar, Tabs, Tab, AvatarButton } from './Nav.styles';

type NavPage = 'library' | 'search';

interface NavProps {
  active: NavPage;
  onNavigate: (page: NavPage) => void;
}

const NAV_TABS: { id: NavPage; label: string }[] = [
  { id: 'library', label: 'Library' },
  { id: 'search', label: 'Search' },
];

export const Nav = ({ active, onNavigate }: NavProps) => (
  <Bar>
    <Tabs>
      {NAV_TABS.map(({ id, label }) => (
        <Tab key={id} $active={active === id} onClick={() => onNavigate(id)}>
          <Text variant="label" color={active === id ? 'default' : 'muted'}>
            {label}
          </Text>
        </Tab>
      ))}
    </Tabs>
    <AvatarButton aria-label="Account" />
  </Bar>
);

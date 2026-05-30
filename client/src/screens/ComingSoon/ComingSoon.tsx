import { Text } from '@livre/primitives';
import { Layout } from '../../components';
import { Placeholder } from './ComingSoon.styles';

interface ComingSoonProps {
  title: string;
}

/**
 * Shared placeholder for navigation destinations that are routed but not yet built (Log, Search,
 * Settings). Keeps the links live so the nav rail feels complete while the real screens are still
 * pending. Pass the section name as the title.
 */
export const ComingSoon = ({ title }: ComingSoonProps) => (
  <Layout title={title}>
    <Placeholder>
      <Text variant="h2" as="p">
        Coming soon
      </Text>
      <Text variant="ui-md" color="muted">
        This corner of Livre is still being written.
      </Text>
    </Placeholder>
  </Layout>
);

import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, Text } from '@livre/primitives';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errorMessage';
import { useAuth } from '../../context/AuthContext';
import { Section } from './Section';
import { Block, BlockHead, Actions, Feedback } from './Settings.styles';

/**
 * Admin entry point to the demo sandbox. Entering swaps the session to the isolated demo user (its
 * own seeded library) and lands on the library; the real account is untouched and restored on exit
 * from the demo banner. Reset rebuilds the demo library from its fixture — safe from here since it
 * only ever rewrites demo rows, so an admin can refresh it without first entering.
 */
export const DemoSection = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enterDemo } = useAuth();

  const enterMutation = useMutation({
    mutationFn: () => enterDemo(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      navigate('/library');
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.demo.reset(),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  return (
    <Section
      title="Demo"
      description="Explore Livre with a ready-made library, without touching your own books."
    >
      <Block>
        <BlockHead>
          <Text variant="label" color="accent">
            Enter demo mode
          </Text>
          <Text variant="ui-sm" color="muted">
            Switch into a sample library — varied shelves, ratings, reviews, and a reading timeline
            — to explore the app or show it off. Your real library stays exactly as you left it;
            leave the demo any time from the banner.
          </Text>
        </BlockHead>
        <Actions>
          <Button
            variant="primary"
            size="sm"
            onClick={() => enterMutation.mutate()}
            disabled={enterMutation.isPending}
          >
            <Icon icon="enter" size={16} />
            <Text variant="label" color="onColor">
              {enterMutation.isPending ? 'Entering…' : 'Enter demo mode'}
            </Text>
          </Button>
        </Actions>
        {enterMutation.isError && (
          <Feedback>
            <Text variant="ui-sm" color="destructive">
              {errorMessage(enterMutation.error, 'Failed to enter demo mode')}
            </Text>
          </Feedback>
        )}
      </Block>

      <Block>
        <BlockHead>
          <Text variant="label" color="accent">
            Reset demo data
          </Text>
          <Text variant="ui-sm" color="muted">
            Rebuild the demo library from scratch, discarding anything changed inside the demo. Only
            the demo library is affected.
          </Text>
        </BlockHead>
        <Actions>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
          >
            <Icon icon="delete" size={16} />
            <Text variant="label" color="default">
              {resetMutation.isPending ? 'Resetting…' : 'Reset demo data'}
            </Text>
          </Button>
        </Actions>
        <Feedback>
          {resetMutation.isSuccess && (
            <Text variant="ui-sm" color="accent">
              Demo library reset.
            </Text>
          )}
          {resetMutation.isError && (
            <Text variant="ui-sm" color="destructive">
              {errorMessage(resetMutation.error, 'Failed to reset demo data')}
            </Text>
          )}
        </Feedback>
      </Block>
    </Section>
  );
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Icon, Text } from '@livre/primitives';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Pill, Label, Dot } from './DemoBanner.styles';

/**
 * Floating affordance shown only while the session is the demo sandbox. It makes the demo state
 * unmistakable (the point, for screenshots and a public demo) and offers the two demo-only actions:
 * reset the sandbox to its pristine fixture, or exit back to the real account. Both invalidate every
 * query so the swapped-in data loads. Renders nothing outside demo mode, so it's safe to mount once
 * for all authenticated screens.
 */
export const DemoBanner = () => {
  const { demo, exitDemo } = useAuth();
  const queryClient = useQueryClient();

  const resetMutation = useMutation({
    mutationFn: () => api.demo.reset(),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  if (!demo) return null;

  const handleExit = async () => {
    await exitDemo();
    queryClient.invalidateQueries();
  };

  return (
    <Pill>
      <Label>
        <Dot />
        <Text variant="label" color="accent">
          Demo mode
        </Text>
      </Label>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => resetMutation.mutate()}
        disabled={resetMutation.isPending}
      >
        <Icon icon="delete" size={16} />
        <Text variant="label" color="default">
          {resetMutation.isPending ? 'Resetting…' : 'Reset'}
        </Text>
      </Button>
      <Button variant="secondary" size="sm" onClick={handleExit}>
        <Text variant="label" color="default">
          Exit demo
        </Text>
      </Button>
    </Pill>
  );
};

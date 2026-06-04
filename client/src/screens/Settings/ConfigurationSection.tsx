import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Text } from '@livre/primitives';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errorMessage';
import { Section } from './Section';
import { Block, BlockHead, Field, Actions, Feedback } from './Settings.styles';

/**
 * Instance configuration: the Google Books API key (validated against the live API before storing)
 * and the per-instance daily cap on Google Books import lookups. Admin-only — the Settings nav only
 * surfaces this section to admins, and the underlying routes enforce the same.
 */
export const ConfigurationSection = () => {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.config.updateSourceKey('GOOGLE_BOOKS', apiKey),
    onSuccess: () => setApiKey(''),
  });

  const importSourcesQuery = useQuery({
    queryKey: ['import-sources'],
    queryFn: () => api.library.importSources(),
  });
  const currentLimit = importSourcesQuery.data?.find((o) => o.id === 'GOOGLE_BOOKS')?.usage?.limit;
  const [limit, setLimit] = useState<string | null>(null);
  const limitValue = limit ?? (currentLimit !== undefined ? String(currentLimit) : '');

  const limitMutation = useMutation({
    mutationFn: () => api.config.updateSourceLimit('GOOGLE_BOOKS', Number(limitValue)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['import-sources'] }),
  });

  return (
    <Section
      title="Configuration"
      description="Instance-wide settings that affect every reader on this server."
    >
      <Block>
        <BlockHead>
          <Text variant="label" color="accent">
            Google Books API key
          </Text>
          <Text variant="ui-sm" color="muted">
            Used to look up book metadata. The key is validated against the API before it's saved.
          </Text>
        </BlockHead>
        <Field>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy…"
            autoComplete="off"
          />
        </Field>
        <Actions>
          <Button
            variant="primary"
            size="sm"
            disabled={!apiKey || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Text variant="label" color="onColor">
              {mutation.isPending ? 'Saving…' : 'Save key'}
            </Text>
          </Button>
        </Actions>
        <Feedback>
          {mutation.isError && (
            <Text variant="ui-sm" color="muted">
              {errorMessage(mutation.error, 'Failed to update key')}
            </Text>
          )}
          {mutation.isSuccess && (
            <Text variant="ui-sm" color="accent">
              API key updated.
            </Text>
          )}
        </Feedback>
      </Block>

      <Block>
        <BlockHead>
          <Text variant="label" color="accent">
            Daily import lookups
          </Text>
          <Text variant="ui-sm" color="muted">
            How many Google Books lookups an import may spend per day on this instance, matching
            your key&rsquo;s quota (Google&rsquo;s free tier is 1,000/day). Larger imports continue
            after the limit resets at midnight Pacific.
          </Text>
        </BlockHead>
        <Field>
          <Input
            type="number"
            min={1}
            value={limitValue}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="1000"
          />
        </Field>
        <Actions>
          <Button
            variant="primary"
            size="sm"
            disabled={!limitValue || Number(limitValue) < 1 || limitMutation.isPending}
            onClick={() => limitMutation.mutate()}
          >
            <Text variant="label" color="onColor">
              {limitMutation.isPending ? 'Saving…' : 'Save limit'}
            </Text>
          </Button>
        </Actions>
        <Feedback>
          {limitMutation.isError && (
            <Text variant="ui-sm" color="muted">
              {errorMessage(limitMutation.error, 'Failed to update limit')}
            </Text>
          )}
          {limitMutation.isSuccess && (
            <Text variant="ui-sm" color="accent">
              Daily limit updated.
            </Text>
          )}
        </Feedback>
      </Block>
    </Section>
  );
};

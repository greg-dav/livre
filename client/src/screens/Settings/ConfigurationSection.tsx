import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Select, Text } from '@livre/primitives';
import { bookSourceSchema, type BookSource } from '@livre/types';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errorMessage';
import { Section } from './Section';
import { Block, BlockHead, Field, Actions, Feedback } from './Settings.styles';

/**
 * Instance configuration: the preferred metadata source the discovery screens resolve to (with
 * automatic fallback), the Google Books API key (validated against the live API before storing), and
 * the per-instance daily cap on Google Books import lookups. Admin-only — the Settings nav only
 * surfaces this section to admins, and the underlying routes enforce the same.
 */
export const ConfigurationSection = () => {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.config.updateSourceKey('GOOGLE_BOOKS', apiKey),
    onSuccess: () => {
      setApiKey('');
      queryClient.invalidateQueries({ queryKey: ['import-sources'] });
      queryClient.invalidateQueries({ queryKey: ['preferred-source'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const importSourcesQuery = useQuery({
    queryKey: ['import-sources'],
    queryFn: () => api.library.importSources(),
  });
  const sources = importSourcesQuery.data ?? [];
  const currentLimit = sources.find((o) => o.id === 'GOOGLE_BOOKS')?.usage?.limit;
  const [limit, setLimit] = useState<string | null>(null);
  const limitValue = limit ?? (currentLimit !== undefined ? String(currentLimit) : '');
  const limitDirty =
    limit !== null && limitValue !== (currentLimit !== undefined ? String(currentLimit) : '');

  const limitMutation = useMutation({
    mutationFn: () => api.config.updateSourceLimit('GOOGLE_BOOKS', Number(limitValue)),
    onSuccess: () => {
      setLimit(null);
      queryClient.invalidateQueries({ queryKey: ['import-sources'] });
    },
  });

  // Only configurable sources that have been configured are offered, alongside keyless ones — the
  // import-sources list already encodes exactly that availability rule.
  const preferredSourceQuery = useQuery({
    queryKey: ['preferred-source'],
    queryFn: () => api.config.preferredSource(),
  });
  const preferredMutation = useMutation({
    mutationFn: (source: BookSource) => api.config.setPreferredSource(source),
    // Reflect the pick in the controlled Select immediately; the server moves exactly the requested
    // source to the front, so the optimistic value matches what the refetch returns. Roll back on error.
    onMutate: async (source) => {
      await queryClient.cancelQueries({ queryKey: ['preferred-source'] });
      const previous = queryClient.getQueryData<{ source: BookSource }>(['preferred-source']);
      queryClient.setQueryData(['preferred-source'], { source });
      return { previous };
    },
    onError: (_err, _source, context) => {
      if (context?.previous) queryClient.setQueryData(['preferred-source'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['preferred-source'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  return (
    <Section
      title="Configuration"
      description="Instance-wide settings that affect every reader on this server."
    >
      <Block>
        <BlockHead>
          <Text variant="label" color="accent">
            Preferred metadata source
          </Text>
          <Text variant="ui-sm" color="muted">
            The source search and book lookups use first. If it isn&rsquo;t configured or runs out
            of its daily quota, the app falls back to another source automatically. Only configured
            sources are offered; add a Google Books key below to make it selectable.
          </Text>
        </BlockHead>
        <Field>
          <Select
            value={preferredSourceQuery.data?.source ?? ''}
            onValueChange={(value) => preferredMutation.mutate(bookSourceSchema.parse(value))}
            options={sources.map((s) => ({ value: s.id, label: s.label }))}
            placeholder="Loading…"
          />
        </Field>
        <Feedback>
          {preferredMutation.isError && (
            <Text variant="ui-sm" color="muted">
              {errorMessage(preferredMutation.error, 'Failed to update preferred source')}
            </Text>
          )}
          {preferredMutation.isSuccess && (
            <Text variant="ui-sm" color="accent">
              Preferred source updated.
            </Text>
          )}
        </Feedback>
      </Block>

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
            disabled={
              !limitValue || Number(limitValue) < 1 || !limitDirty || limitMutation.isPending
            }
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

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, Text } from '@livre/primitives';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errorMessage';
import { Section } from './Section';
import { Block, BlockHead, Field, Actions, Feedback } from './Settings.styles';

/**
 * Instance configuration. Currently just the Google Books API key, which is validated against the
 * live API before it's stored. Admin-only — the Settings nav only surfaces this section to admins,
 * and the underlying route enforces the same.
 */
export const ConfigurationSection = () => {
  const [apiKey, setApiKey] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.config.updateGoogleBooksKey(apiKey),
    onSuccess: () => setApiKey(''),
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
    </Section>
  );
};

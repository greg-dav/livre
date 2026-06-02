import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, Text } from '@livre/primitives';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errorMessage';
import { Section } from './Section';
import { Block, BlockHead, Field, Actions, Feedback } from './Settings.styles';

/**
 * Self-service account settings for the signed-in reader: change username and password. A username
 * change re-issues the session token, so the returned credentials are pushed straight back into the
 * auth context to keep the session valid.
 */
export const AccountSection = () => {
  const { user, login } = useAuth();
  const [username, setUsername] = useState(user?.username ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const usernameMutation = useMutation({
    mutationFn: () => api.account.updateUsername(username.trim()),
    onSuccess: ({ token, user: updated }) => login(token, updated),
  });

  const passwordMutation = useMutation({
    mutationFn: () => api.account.updatePassword(currentPassword, newPassword),
    onSuccess: ({ token, user: updated }) => {
      // The change revokes other sessions; adopt the fresh token so this one survives.
      login(token, updated);
      setCurrentPassword('');
      setNewPassword('');
    },
  });

  const usernameChanged = username.trim().length >= 2 && username.trim() !== user?.username;
  const passwordReady = currentPassword.length > 0 && newPassword.length >= 8;

  return (
    <Section
      title="Account"
      description="Update the credentials you use to sign in to this Livre instance."
    >
      <Block>
        <BlockHead>
          <Text variant="label" color="accent">
            Username
          </Text>
        </BlockHead>
        <Field>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </Field>
        <Actions>
          <Button
            variant="primary"
            size="sm"
            disabled={!usernameChanged || usernameMutation.isPending}
            onClick={() => usernameMutation.mutate()}
          >
            <Text variant="label" color="onColor">
              {usernameMutation.isPending ? 'Saving…' : 'Save username'}
            </Text>
          </Button>
        </Actions>
        <Feedback>
          {usernameMutation.isError && (
            <Text variant="ui-sm" color="muted">
              {errorMessage(usernameMutation.error, 'Failed to update username')}
            </Text>
          )}
          {usernameMutation.isSuccess && (
            <Text variant="ui-sm" color="accent">
              Username updated.
            </Text>
          )}
        </Feedback>
      </Block>

      <Block>
        <BlockHead>
          <Text variant="label" color="accent">
            Password
          </Text>
        </BlockHead>
        <Field>
          <Text variant="ui-sm" color="muted">
            Current password
          </Text>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <Field>
          <Text variant="ui-sm" color="muted">
            New password
          </Text>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </Field>
        <Actions>
          <Button
            variant="primary"
            size="sm"
            disabled={!passwordReady || passwordMutation.isPending}
            onClick={() => passwordMutation.mutate()}
          >
            <Text variant="label" color="onColor">
              {passwordMutation.isPending ? 'Saving…' : 'Change password'}
            </Text>
          </Button>
        </Actions>
        <Feedback>
          {passwordMutation.isError && (
            <Text variant="ui-sm" color="muted">
              {errorMessage(passwordMutation.error, 'Failed to update password')}
            </Text>
          )}
          {passwordMutation.isSuccess && (
            <Text variant="ui-sm" color="accent">
              Password changed.
            </Text>
          )}
        </Feedback>
      </Block>
    </Section>
  );
};

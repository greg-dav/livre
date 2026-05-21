import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Form from '@radix-ui/react-form';
import { Text, Logo, Button, Input, Card, FormRoot, FormField, FormLabel } from '@livre/primitives';
import { api } from '../../lib/api';
import { useLoginMutation } from '../../hooks/auth';
import { Page } from './Login.styles';

/**
 * Authenticates an existing user. Redirects to /setup automatically if the instance has no
 * accounts yet — this handles the first-run case without requiring users to know about /setup
 * directly. Server errors are surfaced inline; field-level validation is handled by Radix Form.
 */
export const Login = () => {
  const navigate = useNavigate();
  const mutation = useLoginMutation();

  useEffect(() => {
    api.auth.status().then(({ hasUsers }) => {
      if (!hasUsers) navigate('/setup', { replace: true });
    });
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    mutation.mutate({
      username: String(data.get('username') ?? ''),
      password: String(data.get('password') ?? ''),
    });
  };

  return (
    <Page>
      <Logo />
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <Text variant="h5">Sign in</Text>
        <FormRoot onSubmit={handleSubmit}>
          <FormField name="username">
            <FormLabel>
              <Text variant="label">Username</Text>
            </FormLabel>
            <Form.Control asChild>
              <Input type="text" autoComplete="username" autoFocus required />
            </Form.Control>
            <Form.Message match="valueMissing">
              <Text variant="ui-xs" color="accent">
                Username is required
              </Text>
            </Form.Message>
          </FormField>

          <FormField name="password">
            <FormLabel>
              <Text variant="label">Password</Text>
            </FormLabel>
            <Form.Control asChild>
              <Input type="password" autoComplete="current-password" required />
            </Form.Control>
            <Form.Message match="valueMissing">
              <Text variant="ui-xs" color="accent">
                Password is required
              </Text>
            </Form.Message>
          </FormField>

          {mutation.isError && (
            <Text variant="ui-sm" color="accent">
              {mutation.error.message}
            </Text>
          )}

          <Form.Submit asChild>
            <Button disabled={mutation.isPending}>
              <Text variant="label" color="onColor">
                {mutation.isPending ? 'Signing in…' : 'Sign in'}
              </Text>
            </Button>
          </Form.Submit>
        </FormRoot>
      </Card>
    </Page>
  );
};

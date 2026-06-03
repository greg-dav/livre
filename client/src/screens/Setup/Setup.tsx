import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text, Logo, Button, Input, Card, CardHeader, Form } from '@livre/primitives';
import { api } from '../../lib/api';
import { useRegisterMutation } from './useRegisterMutation';
import { Page } from './Setup.styles';

/**
 * First-run screen for creating the initial admin account. Only reachable when no users exist —
 * the Login screen redirects here automatically on a fresh install. The first account registered
 * through this screen receives admin privileges; all subsequent accounts are regular users.
 * Password confirmation is validated client-side via Radix Form's match function.
 */
export const Setup = () => {
  const navigate = useNavigate();
  const mutation = useRegisterMutation();

  useEffect(() => {
    api.auth.status().then(({ hasUsers }) => {
      if (hasUsers) navigate('/login', { replace: true });
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
        <CardHeader>
          <Text variant="h5">Create your account</Text>
          <Text variant="ui-sm" color="muted">
            You're the first user. This account will be the administrator.
          </Text>
        </CardHeader>
        <Form.Root onSubmit={handleSubmit}>
          <Form.Field name="username">
            <Form.Label>
              <Text variant="label">Username</Text>
            </Form.Label>
            <Form.Control asChild>
              <Input
                type="text"
                autoComplete="username"
                autoFocus
                required
                minLength={2}
                maxLength={32}
              />
            </Form.Control>
            <Form.Message match="valueMissing">
              <Text variant="ui-xs" color="accent">
                Username is required
              </Text>
            </Form.Message>
            <Form.Message match="tooShort">
              <Text variant="ui-xs" color="accent">
                Username must be at least 2 characters
              </Text>
            </Form.Message>
          </Form.Field>

          <Form.Field name="password">
            <Form.Label>
              <Text variant="label">Password</Text>
            </Form.Label>
            <Form.Control asChild>
              <Input type="password" autoComplete="new-password" required minLength={8} />
            </Form.Control>
            <Form.Message match="valueMissing">
              <Text variant="ui-xs" color="accent">
                Password is required
              </Text>
            </Form.Message>
            <Form.Message match="tooShort">
              <Text variant="ui-xs" color="accent">
                Password must be at least 8 characters
              </Text>
            </Form.Message>
          </Form.Field>

          <Form.Field name="confirm">
            <Form.Label>
              <Text variant="label">Confirm password</Text>
            </Form.Label>
            <Form.Control asChild>
              <Input type="password" autoComplete="new-password" required />
            </Form.Control>
            <Form.Message match="valueMissing">
              <Text variant="ui-xs" color="accent">
                Please confirm your password
              </Text>
            </Form.Message>
            <Form.Message
              match={(value: string, formData: FormData) => value !== formData.get('password')}
            >
              <Text variant="ui-xs" color="accent">
                Passwords do not match
              </Text>
            </Form.Message>
          </Form.Field>

          {mutation.isError && (
            <Text variant="ui-sm" color="accent">
              {mutation.error.message}
            </Text>
          )}

          <Form.Submit asChild>
            <Button disabled={mutation.isPending}>
              <Text variant="label" color="onColor">
                {mutation.isPending ? 'Creating account…' : 'Create account'}
              </Text>
            </Button>
          </Form.Submit>
        </Form.Root>
      </Card>
    </Page>
  );
};

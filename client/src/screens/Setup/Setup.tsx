import * as Form from '@radix-ui/react-form';
import {
  Text,
  Logo,
  Button,
  Input,
  Card,
  CardHeader,
  FormRoot,
  FormField,
  FormLabel,
} from '@livre/primitives';
import { useRegisterMutation } from '../../hooks/auth';
import { Page } from './Setup.styles';

/**
 * First-run screen for creating the initial admin account. Only reachable when no users exist —
 * the Login screen redirects here automatically on a fresh install. The first account registered
 * through this screen receives admin privileges; all subsequent accounts are regular users.
 * Password confirmation is validated client-side via Radix Form's match function.
 */
export const Setup = () => {
  const mutation = useRegisterMutation();

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
        <FormRoot onSubmit={handleSubmit}>
          <FormField name="username">
            <FormLabel>
              <Text variant="label">Username</Text>
            </FormLabel>
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
          </FormField>

          <FormField name="password">
            <FormLabel>
              <Text variant="label">Password</Text>
            </FormLabel>
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
          </FormField>

          <FormField name="confirm">
            <FormLabel>
              <Text variant="label">Confirm password</Text>
            </FormLabel>
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
          </FormField>

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
        </FormRoot>
      </Card>
    </Page>
  );
};

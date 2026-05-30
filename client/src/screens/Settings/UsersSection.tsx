import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type CreateUserBody, type UpdateUserBody } from '@livre/types';
import { Button, Dialog, Icon, Input, Loader, Pill, Text } from '@livre/primitives';
import { useAuth } from '../../context/AuthContext';
import { api, type ManagedUser } from '../../lib/api';
import { errorMessage } from '../../lib/errorMessage';
import { SectionHead } from './Settings.styles';
import {
  SectionHeadRow,
  UserList,
  UserRow,
  RowLeft,
  RowMeta,
  RowActions,
  IconButton,
  DialogForm,
  DialogActions,
  FieldStack,
  AdminToggle,
} from './UsersSection.styles';

type SaveAction =
  | { type: 'create'; body: CreateUserBody }
  | { type: 'update'; id: number; body: UpdateUserBody };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ManagedUser | null;
  onSubmit: (body: { username: string; password: string; isAdmin: boolean }) => void;
  pending: boolean;
  error: string | null;
}

/**
 * Shared create/edit form. In edit mode the password field is optional — leaving it blank keeps the
 * existing password — so the same dialog serves both flows without a separate component.
 */
const UserFormDialog = ({
  open,
  onOpenChange,
  user,
  onSubmit,
  pending,
  error,
}: UserFormDialogProps) => {
  const editing = user !== null;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (open) {
      setUsername(user?.username ?? '');
      setPassword('');
      setIsAdmin(user?.is_admin ?? false);
    }
  }, [open, user]);

  const ready =
    username.trim().length >= 2 &&
    (editing || password.length >= 8) &&
    (password.length === 0 || password.length >= 8);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit user' : 'Add user'}
      description={
        editing
          ? 'Update this account. Leave the password blank to keep it unchanged.'
          : 'Create a new account for this Livre instance.'
      }
    >
      <DialogForm>
        <FieldStack>
          <Text variant="ui-sm" color="muted">
            Username
          </Text>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
          />
        </FieldStack>
        <FieldStack>
          <Text variant="ui-sm" color="muted">
            {editing ? 'New password (optional)' : 'Password'}
          </Text>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </FieldStack>
        <AdminToggle type="button" $on={isAdmin} onClick={() => setIsAdmin((v) => !v)}>
          <span data-box>{isAdmin && <Icon icon="check" size={14} />}</span>
          <Text variant="ui-sm">Administrator</Text>
        </AdminToggle>
        {error && (
          <Text variant="ui-sm" color="muted">
            {error}
          </Text>
        )}
        <DialogActions>
          <Dialog.Close asChild>
            <Button variant="ghost" size="sm">
              <Text variant="label" color="default">
                Cancel
              </Text>
            </Button>
          </Dialog.Close>
          <Button
            variant="primary"
            size="sm"
            disabled={!ready || pending}
            onClick={() => onSubmit({ username: username.trim(), password, isAdmin })}
          >
            <Text variant="label" color="onColor">
              {pending ? 'Saving…' : editing ? 'Save' : 'Create'}
            </Text>
          </Button>
        </DialogActions>
      </DialogForm>
    </Dialog>
  );
};

/**
 * Admin-only user management. Lists every account and offers add / edit / remove. Destructive and
 * privilege guards (can't delete yourself, can't drop the last admin) are enforced server-side; the
 * UI just disables self-deletion as a courtesy. Only surfaced in the nav for admins.
 */
export const UsersSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formUser, setFormUser] = useState<ManagedUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.list(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const saveMutation = useMutation({
    mutationFn: (action: SaveAction) =>
      action.type === 'create'
        ? api.users.create(action.body)
        : api.users.update(action.id, action.body),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
    },
  });

  const handleSubmit = (body: { username: string; password: string; isAdmin: boolean }) => {
    if (!formUser) {
      saveMutation.mutate({ type: 'create', body });
      return;
    }
    const patch: UpdateUserBody = {};
    if (body.username !== formUser.username) patch.username = body.username;
    if (body.password.length > 0) patch.password = body.password;
    if (body.isAdmin !== formUser.is_admin) patch.isAdmin = body.isAdmin;
    // Nothing changed — close without an empty PATCH the server would reject.
    if (Object.keys(patch).length === 0) {
      setFormOpen(false);
      return;
    }
    saveMutation.mutate({ type: 'update', id: formUser.id, body: patch });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.users.remove(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const openAdd = () => {
    setFormUser(null);
    saveMutation.reset();
    setFormOpen(true);
  };

  const openEdit = (target: ManagedUser) => {
    setFormUser(target);
    saveMutation.reset();
    setFormOpen(true);
  };

  return (
    <>
      <SectionHead>
        <SectionHeadRow>
          <div>
            <Text variant="h3" as="h2">
              Users
            </Text>
            <Text variant="ui-sm" color="muted">
              Manage who can sign in to this Livre instance.
            </Text>
          </div>
          <Button variant="secondary" size="sm" onClick={openAdd}>
            <Icon icon="add" size={16} />
            <Text variant="label" color="default">
              Add user
            </Text>
          </Button>
        </SectionHeadRow>
      </SectionHead>

      {isLoading || !data ? (
        <Loader />
      ) : (
        <UserList>
          {data.users.map((u) => {
            const isSelf = u.id === user?.id;
            return (
              <UserRow key={u.id}>
                <RowLeft>
                  <Icon icon="account" />
                  <RowMeta>
                    <Text variant="ui-md">{u.username}</Text>
                    <Text variant="ui-xs" color="muted">
                      Joined {formatDate(u.created_at)}
                    </Text>
                  </RowMeta>
                  {u.is_admin && (
                    <Pill variant="ghost">
                      <Text variant="ui-xs" color="muted">
                        Admin
                      </Text>
                    </Pill>
                  )}
                  {isSelf && (
                    <Pill variant="ghost">
                      <Text variant="ui-xs" color="muted">
                        You
                      </Text>
                    </Pill>
                  )}
                </RowLeft>
                <RowActions>
                  <IconButton aria-label={`Edit ${u.username}`} onClick={() => openEdit(u)}>
                    <Icon icon="edit" size={16} />
                  </IconButton>
                  <IconButton
                    aria-label={`Remove ${u.username}`}
                    $danger
                    disabled={isSelf}
                    onClick={() => setDeleteTarget(u)}
                  >
                    <Icon icon="delete" size={16} />
                  </IconButton>
                </RowActions>
              </UserRow>
            );
          })}
        </UserList>
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={formUser}
        onSubmit={handleSubmit}
        pending={saveMutation.isPending}
        error={
          saveMutation.isError ? errorMessage(saveMutation.error, 'Failed to save user') : null
        }
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove user"
        description={
          deleteTarget
            ? `Remove ${deleteTarget.username}? Their library and reading history are deleted permanently.`
            : ''
        }
      >
        <DialogActions>
          <Dialog.Close asChild>
            <Button variant="ghost" size="sm">
              <Text variant="label" color="default">
                Cancel
              </Text>
            </Button>
          </Dialog.Close>
          <Button
            variant="primary"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            <Text variant="label" color="onColor">
              {deleteMutation.isPending ? 'Removing…' : 'Remove'}
            </Text>
          </Button>
        </DialogActions>
        {deleteMutation.isError && (
          <Text variant="ui-sm" color="muted">
            {errorMessage(deleteMutation.error, 'Failed to remove user')}
          </Text>
        )}
      </Dialog>
    </>
  );
};

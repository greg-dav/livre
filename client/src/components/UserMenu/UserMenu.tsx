import { useState } from 'react';
import { Text, DropdownMenu, Dialog, Input, Button } from '@livre/primitives';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import { Trigger, DialogForm, DialogActions } from './UserMenu.styles';

/**
 * Avatar button that opens a dropdown with app-scoped user actions. Reads auth and theme state
 * directly since it's always rendered in an authenticated context. Sits at the top level of every
 * authenticated screen — page-specific actions belong on the screen itself, not here.
 * Admin users see an extra item to rotate the Google Books API key without touching the DB.
 */
export const UserMenu = () => {
  const { user, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeySaving, setApiKeySaving] = useState(false);

  const handleApiKeyOpenChange = (open: boolean) => {
    setApiKeyOpen(open);
    if (!open) {
      setApiKeyValue('');
      setApiKeyError(null);
    }
  };

  const handleSaveApiKey = async () => {
    setApiKeySaving(true);
    setApiKeyError(null);
    try {
      await api.config.updateGoogleBooksKey(apiKeyValue);
      setApiKeyOpen(false);
    } catch (e) {
      setApiKeyError(e instanceof Error ? e.message : 'Failed to update API key');
    } finally {
      setApiKeySaving(false);
    }
  };

  return (
    <>
      <DropdownMenu
        trigger={
          <Trigger aria-label="User menu">
            <Text variant="ui-sm" color="muted">
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </Trigger>
        }
        align="end"
        sideOffset={8}
      >
        <DropdownMenu.Item disabled>
          <Text variant="ui-sm" color="muted">
            {user?.username}
          </Text>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onSelect={toggleTheme}>
          <Text variant="ui-sm">Toggle theme</Text>
        </DropdownMenu.Item>
        {user?.is_admin && (
          <>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onSelect={() => setApiKeyOpen(true)}>
              <Text variant="ui-sm">Update API key</Text>
            </DropdownMenu.Item>
          </>
        )}
        <DropdownMenu.Separator />
        <DropdownMenu.Item onSelect={logout}>
          <Text variant="ui-sm">Sign out</Text>
        </DropdownMenu.Item>
      </DropdownMenu>

      {user?.is_admin && (
        <Dialog
          open={apiKeyOpen}
          onOpenChange={handleApiKeyOpenChange}
          title="Google Books API Key"
          description="Enter a new key. It will be validated against the API before saving."
        >
          <DialogForm>
            <Input
              type="password"
              value={apiKeyValue}
              onChange={(e) => setApiKeyValue(e.target.value)}
              placeholder="AIzaSy..."
              onKeyDown={(e) =>
                e.key === 'Enter' && !apiKeySaving && apiKeyValue && handleSaveApiKey()
              }
            />
            {apiKeyError && (
              <Text variant="ui-sm" color="muted">
                {apiKeyError}
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
                disabled={!apiKeyValue || apiKeySaving}
                onClick={handleSaveApiKey}
              >
                <Text variant="label" color="onColor">
                  {apiKeySaving ? 'Saving…' : 'Save'}
                </Text>
              </Button>
            </DialogActions>
          </DialogForm>
        </Dialog>
      )}
    </>
  );
};

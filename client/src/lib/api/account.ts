import { initClient } from '@ts-rest/core';
import { accountContract, type ThemeName } from '@livre/types';
import { BASE, clientOpts, ok } from './http';

const client = initClient(accountContract, { ...clientOpts, baseUrl: `${BASE}/account` });

export const account = {
  me: () => client.me().then(ok),
  updateUsername: (username: string) => client.updateUsername({ body: { username } }).then(ok),
  updatePassword: (currentPassword: string, newPassword: string) =>
    client.updatePassword({ body: { currentPassword, newPassword } }).then(ok),
  updateTheme: (theme: ThemeName) => client.updateTheme({ body: { theme } }).then(ok),
};

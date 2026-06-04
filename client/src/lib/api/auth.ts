import { initClient } from '@ts-rest/core';
import { authContract } from '@livre/types';
import { BASE, clientOpts, ok } from './http';

const client = initClient(authContract, { ...clientOpts, baseUrl: `${BASE}/auth` });

export const auth = {
  status: () => client.status().then(ok),
  register: (username: string, password: string) =>
    client.register({ body: { username, password } }).then(ok),
  login: (username: string, password: string) =>
    client.login({ body: { username, password } }).then(ok),
};

import { initClient } from '@ts-rest/core';
import { usersContract, type CreateUserBody, type UpdateUserBody } from '@livre/types';
import { BASE, clientOpts, ok } from './http';

const client = initClient(usersContract, { ...clientOpts, baseUrl: `${BASE}/users` });

export const users = {
  list: () => client.list().then(ok),
  create: (body: CreateUserBody) => client.create({ body }).then(ok),
  update: (id: number, body: UpdateUserBody) => client.update({ params: { id }, body }).then(ok),
  remove: (id: number) => client.remove({ params: { id } }).then(ok),
};

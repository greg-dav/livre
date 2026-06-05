import { initClient } from '@ts-rest/core';
import { demoContract } from '@livre/types';
import { BASE, clientOpts, ok } from './http';

const client = initClient(demoContract, { ...clientOpts, baseUrl: `${BASE}/demo` });

export const demo = {
  enter: () => client.enter({ body: {} }).then(ok),
  reset: () => client.reset({ body: {} }).then(ok),
};

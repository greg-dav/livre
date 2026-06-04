import { initClient } from '@ts-rest/core';
import { logContract } from '@livre/types';
import { BASE, clientOpts, ok } from './http';

const client = initClient(logContract, { ...clientOpts, baseUrl: `${BASE}/log` });

export const log = {
  timeline: (range?: { start: string; end: string }) =>
    client.timeline({ query: range ?? {} }).then(ok),
};

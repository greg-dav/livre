import { initClient } from '@ts-rest/core';
import { configContract, type BookSource } from '@livre/types';
import { BASE, clientOpts, ok } from './http';

const client = initClient(configContract, { ...clientOpts, baseUrl: `${BASE}/config` });

export const config = {
  updateSourceKey: (source: BookSource, apiKey: string) =>
    client.updateApiKey({ params: { source }, body: { apiKey } }).then(ok),
  updateSourceLimit: (source: BookSource, limit: number) =>
    client.updateDailyLimit({ params: { source }, body: { limit } }).then(ok),
  preferredSource: () => client.getPreferredSource().then(ok),
  setPreferredSource: (source: BookSource) =>
    client.setPreferredSource({ body: { source } }).then(ok),
};

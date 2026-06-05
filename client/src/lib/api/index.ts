import { auth } from './auth';
import { demo } from './demo';
import { search } from './search';
import { library } from './library';
import { log } from './log';
import { config } from './config';
import { account } from './account';
import { users } from './users';

export type { User, ManagedUser, ThemeName } from '@livre/types';

/**
 * The app's single API surface, assembled from one slice per domain (each owning its own ts-rest
 * client). Domains mirror the backend contracts: `search` is read-only discovery; `library` owns
 * the user's collection and every write to it (including the non-JSON import/export). Consumers
 * import `api` and call `api.<domain>.<method>` — they never touch a ts-rest client directly.
 */
export const api = {
  auth,
  demo,
  search,
  library,
  log,
  config,
  account,
  users,
};

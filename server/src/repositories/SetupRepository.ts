import { db } from '../db';
import { users } from '../db/schema';
import { config } from '../db/schema';
import { userSchema, type User } from '@livre/types';
import { ConfigRepository } from './ConfigRepository';

type SetupData = {
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  googleBooksApiKey: string;
};

export class SetupRepository {
  execute(data: SetupData): User {
    return db.transaction((tx) => {
      const row = tx
        .insert(users)
        .values({
          username: data.username,
          passwordHash: data.passwordHash,
          isAdmin: data.isAdmin,
        })
        .returning({ id: users.id, username: users.username, isAdmin: users.isAdmin })
        .get();
      tx.insert(config)
        .values({ key: ConfigRepository.GOOGLE_BOOKS_API_KEY, value: data.googleBooksApiKey })
        .onConflictDoUpdate({ target: config.key, set: { value: data.googleBooksApiKey } })
        .run();
      return userSchema.parse({ id: row?.id, username: row?.username, is_admin: row?.isAdmin });
    });
  }
}

import { db } from '../db';
import { users } from '../db/schema';
import { userSchema, type User } from '@livre/types';

type SetupData = {
  username: string;
  passwordHash: string;
  isAdmin: boolean;
};

export class SetupRepository {
  execute(data: SetupData): User {
    const row = db
      .insert(users)
      .values({
        username: data.username,
        passwordHash: data.passwordHash,
        isAdmin: data.isAdmin,
      })
      .returning({ id: users.id, username: users.username, isAdmin: users.isAdmin })
      .get();
    return userSchema.parse({ id: row?.id, username: row?.username, is_admin: row?.isAdmin });
  }
}

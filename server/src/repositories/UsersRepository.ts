import { count, eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

export class UsersRepository {
  count(): number {
    return db.select({ total: count() }).from(users).get()?.total ?? 0;
  }

  findByUsername(username: string) {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  updateLastLogin(id: number): void {
    db.update(users).set({ lastLogin: new Date().toISOString() }).where(eq(users.id, id)).run();
  }
}

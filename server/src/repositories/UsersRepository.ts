import { and, count, eq, ne, sql } from 'drizzle-orm';
import { managedUserSchema, type ManagedUser, type ThemeName } from '@livre/types';
import { db } from '../db';
import { users } from '../db/schema';
import { DEMO_USERNAME } from '../lib/demoFixture';

// The reserved demo user is an internal sandbox account, not a real account: it's hidden from the
// admin user list and the registration-gating count so it can never close registration or surface
// the instance owner's roster to a demo visitor.
const notDemo = ne(users.username, DEMO_USERNAME);

type CreateUserData = {
  username: string;
  passwordHash: string;
  isAdmin: boolean;
};

export class UsersRepository {
  // Column projection shared by every read that returns the client-facing ManagedUser shape.
  private static readonly managedColumns = {
    id: users.id,
    username: users.username,
    is_admin: users.isAdmin,
    created_at: users.createdAt,
    last_login: users.lastLogin,
  };

  count(): number {
    return db.select({ total: count() }).from(users).where(notDemo).get()?.total ?? 0;
  }

  findByUsername(username: string) {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  findById(id: number) {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  list(): ManagedUser[] {
    const rows = db
      .select(UsersRepository.managedColumns)
      .from(users)
      .where(notDemo)
      .orderBy(users.createdAt)
      .all();
    return rows.map((row) => managedUserSchema.parse(row));
  }

  findManagedById(id: number): ManagedUser | undefined {
    const row = db.select(UsersRepository.managedColumns).from(users).where(eq(users.id, id)).get();
    return row ? managedUserSchema.parse(row) : undefined;
  }

  create(data: CreateUserData): ManagedUser {
    const row = db
      .insert(users)
      .values({
        username: data.username,
        passwordHash: data.passwordHash,
        isAdmin: data.isAdmin,
      })
      .returning(UsersRepository.managedColumns)
      .get();
    return managedUserSchema.parse(row);
  }

  updateUsername(id: number, username: string): void {
    db.update(users).set({ username }).where(eq(users.id, id)).run();
  }

  updatePassword(id: number, passwordHash: string): void {
    db.update(users).set({ passwordHash }).where(eq(users.id, id)).run();
  }

  updateIsAdmin(id: number, isAdmin: boolean): void {
    db.update(users).set({ isAdmin }).where(eq(users.id, id)).run();
  }

  updateTheme(id: number, theme: ThemeName): void {
    db.update(users).set({ theme }).where(eq(users.id, id)).run();
  }

  delete(id: number): void {
    db.delete(users).where(eq(users.id, id)).run();
  }

  updateLastLogin(id: number): void {
    db.update(users).set({ lastLogin: new Date().toISOString() }).where(eq(users.id, id)).run();
  }

  /** Current token version, or undefined if the user no longer exists. */
  getTokenVersion(id: number): number | undefined {
    return db.select({ v: users.tokenVersion }).from(users).where(eq(users.id, id)).get()?.v;
  }

  /** Invalidate every outstanding token for the user by advancing their token version. */
  bumpTokenVersion(id: number): void {
    db.update(users)
      .set({ tokenVersion: sql`${users.tokenVersion} + 1` })
      .where(eq(users.id, id))
      .run();
  }

  /** True when an admin account other than the given user exists. Guards last-admin removal. */
  hasOtherAdmin(excludingId: number): boolean {
    const total =
      db
        .select({ total: count() })
        .from(users)
        .where(and(eq(users.isAdmin, true), ne(users.id, excludingId)))
        .get()?.total ?? 0;
    return total > 0;
  }
}

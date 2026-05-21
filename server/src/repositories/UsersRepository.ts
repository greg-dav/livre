import db from '../db';
import { userSchema, type User } from '@livre/types';
import { userCountSchema, userRowSchema } from '../schemas/auth';

type CreateData = {
  username: string;
  passwordHash: string;
  publicKey: string;
  privateKey: string;
};

export class UsersRepository {
  private readonly query = {
    count: db.prepare('SELECT COUNT(*) as count FROM users'),
    findByName: db.prepare(
      'SELECT id, username, password_hash, is_admin FROM users WHERE username = ?'
    ),
  };

  private readonly mutation = (() => {
    const insert = db.prepare(
      'INSERT INTO users (username, password_hash, is_admin, public_key, private_key) VALUES (?, ?, ?, ?, ?)'
    );
    return {
      lastLogin: db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?"),
      // Transaction ensures the count and insert are atomic — no two users can both become admin
      create: db.transaction((data: CreateData) => {
        const { count } = userCountSchema.parse(this.query.count.get());
        const isAdmin = count === 0;
        const result = insert.run(
          data.username,
          data.passwordHash,
          isAdmin ? 1 : 0,
          data.publicKey,
          data.privateKey
        );
        return userSchema.parse({
          id: Number(result.lastInsertRowid),
          username: data.username,
          is_admin: isAdmin,
        });
      }),
    };
  })();

  count(): number {
    return userCountSchema.parse(this.query.count.get()).count;
  }

  findByUsername(username: string) {
    const raw = this.query.findByName.get(username);
    return raw !== undefined ? userRowSchema.parse(raw) : undefined;
  }

  create(data: CreateData): User {
    return this.mutation.create(data);
  }

  updateLastLogin(id: number): void {
    this.mutation.lastLogin.run(id);
  }
}

import bcrypt from 'bcryptjs';
import { userSchema, type AuthResponse } from '@livre/types';
import createError from 'http-errors';
import { signToken } from '../lib/token';
import { isUniqueViolation } from '../lib/serviceHelpers';
import { type UsersRepository } from '../repositories/UsersRepository';
import { type SetupRepository } from '../repositories/SetupRepository';

export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly setup: SetupRepository
  ) {}

  getStatus() {
    return { hasUsers: this.users.count() > 0 };
  }

  async register(username: string, password: string): Promise<AuthResponse> {
    // Registration is a one-shot: it exists only to bootstrap the first (admin) account on a fresh
    // install. Once any user exists the instance is closed — there are no invite or self-signup
    // flows, so an open endpoint would let anyone who can reach a privacy-first instance create an
    // account. The client already hides the form post-setup; this is the server-side enforcement.
    if (this.users.count() > 0) {
      throw createError(403, 'Registration is closed');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const user = this.setup.execute({ username, passwordHash, isAdmin: true });
      return { token: signToken(user, 0), user };
    } catch (err) {
      if (isUniqueViolation(err)) throw createError(409, 'Username already taken');
      throw err;
    }
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const row = this.users.findByUsername(username);

    if (!row || !(await bcrypt.compare(password, row.passwordHash))) {
      throw createError(401, 'Invalid credentials');
    }

    this.users.updateLastLogin(row.id);

    const user = userSchema.parse({
      id: row.id,
      username: row.username,
      is_admin: row.isAdmin,
      theme: row.theme,
    });
    return { token: signToken(user, row.tokenVersion), user };
  }
}

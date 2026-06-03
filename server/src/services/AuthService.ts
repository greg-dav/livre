import bcrypt from 'bcryptjs';
import { userSchema, type AuthResponse } from '@livre/types';
import createError from 'http-errors';
import { signToken } from '../lib/token';
import { isUniqueViolation } from '../lib/serviceHelpers';
import { type UsersRepository } from '../repositories/UsersRepository';
import { type SetupRepository } from '../repositories/SetupRepository';
import { type GoogleBooksProvider } from '../providers/GoogleBooksProvider';

export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly setup: SetupRepository,
    private readonly googleBooks: GoogleBooksProvider
  ) {}

  getStatus() {
    return { hasUsers: this.users.count() > 0 };
  }

  async register(
    username: string,
    password: string,
    googleBooksApiKey: string
  ): Promise<AuthResponse> {
    await this.googleBooks.validate(googleBooksApiKey);

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const isAdmin = this.users.count() === 0;
      const user = this.setup.execute({
        username,
        passwordHash,
        isAdmin,
        googleBooksApiKey,
      });
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

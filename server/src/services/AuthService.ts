import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateKeyPair } from 'crypto';
import { promisify } from 'util';
import { z } from 'zod';
import { type AuthResponse } from '@livre/types';
import createError from 'http-errors';
import { env } from '../env';
import { type UsersRepository } from '../repositories/UsersRepository';
import { type SetupRepository } from '../repositories/SetupRepository';
import { type GoogleBooksProvider } from '../providers/GoogleBooksProvider';

const generateKeyPairAsync = promisify(generateKeyPair);

export class AuthService {
  private static readonly sqliteUniqueError = z.object({
    code: z.literal('SQLITE_CONSTRAINT_UNIQUE'),
  });

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

    const [passwordHash, { publicKey, privateKey }] = await Promise.all([
      bcrypt.hash(password, 12),
      generateKeyPairAsync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      }),
    ]);

    try {
      const isAdmin = this.users.count() === 0;
      const user = this.setup.execute({
        username,
        passwordHash,
        publicKey,
        privateKey,
        isAdmin,
        googleBooksApiKey,
      });
      this.googleBooks.invalidate();
      return {
        token: jwt.sign(user, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' }),
        user,
      };
    } catch (err) {
      if (AuthService.sqliteUniqueError.safeParse(err).success)
        throw createError(409, 'Username already taken');
      throw err;
    }
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const row = this.users.findByUsername(username);

    if (!row || !(await bcrypt.compare(password, row.passwordHash))) {
      throw createError(401, 'Invalid credentials');
    }

    this.users.updateLastLogin(row.id);

    const user = { id: row.id, username: row.username, is_admin: row.isAdmin };
    return { token: jwt.sign(user, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' }), user };
  }
}

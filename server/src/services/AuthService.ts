import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateKeyPair } from 'crypto';
import { promisify } from 'util';
import { z } from 'zod';
import { type AuthResponse } from '@livre/types';
import createError from 'http-errors';
import { env } from '../env';
import { type UsersRepository } from '../repositories/UsersRepository';

const generateKeyPairAsync = promisify(generateKeyPair);

export class AuthService {
  private static readonly sqliteUniqueError = z.object({
    code: z.literal('SQLITE_CONSTRAINT_UNIQUE'),
  });

  constructor(private readonly users: UsersRepository) {}

  getStatus() {
    return { hasUsers: this.users.count() > 0 };
  }

  async register(username: string, password: string): Promise<AuthResponse> {
    const [passwordHash, { publicKey, privateKey }] = await Promise.all([
      bcrypt.hash(password, 12),
      generateKeyPairAsync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      }),
    ]);

    try {
      const user = this.users.create({ username, passwordHash, publicKey, privateKey });
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

    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      throw createError(401, 'Invalid credentials');
    }

    this.users.updateLastLogin(row.id);

    const user = { id: row.id, username: row.username, is_admin: row.is_admin };
    return { token: jwt.sign(user, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' }), user };
  }
}

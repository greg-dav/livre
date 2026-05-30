import bcrypt from 'bcryptjs';
import createError from 'http-errors';
import { userSchema, type AuthResponse, type ThemeName } from '@livre/types';
import { signToken } from '../lib/token';
import { found, isUniqueViolation } from '../lib/serviceHelpers';
import { type UsersRepository } from '../repositories/UsersRepository';

type AuthFields = {
  id: number;
  username: string;
  isAdmin: boolean;
  theme: string;
  tokenVersion: number;
};

/**
 * Self-service account actions for the authenticated user. Username and theme changes re-issue the
 * JWT so the stored token stays the source of truth — the client swaps its token on success rather
 * than relying on a separate refresh. A password change additionally bumps the token version to log
 * out every other session, then re-issues a fresh token so the acting session stays signed in.
 */
export class AccountService {
  constructor(private readonly users: UsersRepository) {}

  private buildAuthResponse(fields: AuthFields): AuthResponse {
    const user = userSchema.parse({
      id: fields.id,
      username: fields.username,
      is_admin: fields.isAdmin,
      theme: fields.theme,
    });
    return { token: signToken(user, fields.tokenVersion), user };
  }

  updateUsername(userId: number, username: string): AuthResponse {
    const row = found(this.users.findById(userId), 'User not found');
    try {
      this.users.updateUsername(userId, username);
    } catch (err) {
      if (isUniqueViolation(err)) throw createError(409, 'Username already taken');
      throw err;
    }
    return this.buildAuthResponse({ ...row, username });
  }

  async updatePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResponse> {
    const row = found(this.users.findById(userId), 'User not found');
    if (!(await bcrypt.compare(currentPassword, row.passwordHash)))
      throw createError(403, 'Current password is incorrect');
    this.users.updatePassword(userId, await bcrypt.hash(newPassword, 12));
    this.users.bumpTokenVersion(userId);
    return this.buildAuthResponse({ ...row, tokenVersion: row.tokenVersion + 1 });
  }

  updateTheme(userId: number, theme: ThemeName): AuthResponse {
    const row = found(this.users.findById(userId), 'User not found');
    this.users.updateTheme(userId, theme);
    return this.buildAuthResponse({ ...row, theme });
  }
}

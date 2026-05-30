import bcrypt from 'bcryptjs';
import createError from 'http-errors';
import { type CreateUserBody, type ManagedUser, type UpdateUserBody } from '@livre/types';
import { found, isUniqueViolation } from '../lib/serviceHelpers';
import { type UsersRepository } from '../repositories/UsersRepository';

/**
 * Admin-only management of other accounts. Guards two invariants the UI can't be trusted to keep:
 * an admin may never delete their own account here, and the instance must always retain at least
 * one admin (so the last admin can be neither demoted nor removed).
 */
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  list(): ManagedUser[] {
    return this.users.list();
  }

  private static wrapUnique<T>(fn: () => T): T {
    try {
      return fn();
    } catch (err) {
      if (isUniqueViolation(err)) throw createError(409, 'Username already taken');
      throw err;
    }
  }

  async create(body: CreateUserBody): Promise<ManagedUser> {
    const passwordHash = await bcrypt.hash(body.password, 12);
    return UsersService.wrapUnique(() =>
      this.users.create({ username: body.username, passwordHash, isAdmin: body.isAdmin })
    );
  }

  async update(targetId: number, body: UpdateUserBody): Promise<ManagedUser> {
    const row = found(this.users.findById(targetId), 'User not found');

    const { username, isAdmin, password } = body;

    if (isAdmin === false && row.isAdmin && !this.users.hasOtherAdmin(targetId))
      throw createError(400, 'Cannot remove the last administrator');

    if (username !== undefined)
      UsersService.wrapUnique(() => this.users.updateUsername(targetId, username));
    if (isAdmin !== undefined) this.users.updateIsAdmin(targetId, isAdmin);
    if (password !== undefined)
      this.users.updatePassword(targetId, await bcrypt.hash(password, 12));

    // A role flip or admin password reset must invalidate the target's outstanding sessions so the
    // change takes effect immediately rather than at token expiry. A bare rename is not sensitive.
    if (isAdmin !== undefined || password !== undefined) this.users.bumpTokenVersion(targetId);

    return found(this.users.findManagedById(targetId), 'User not found');
  }

  remove(actingUserId: number, targetId: number): void {
    if (actingUserId === targetId) throw createError(400, 'You cannot delete your own account');
    const row = found(this.users.findById(targetId), 'User not found');
    if (row.isAdmin && !this.users.hasOtherAdmin(targetId))
      throw createError(400, 'Cannot remove the last administrator');
    this.users.delete(targetId);
  }
}

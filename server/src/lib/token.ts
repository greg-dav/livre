import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { userSchema, type User } from '@livre/types';
import { env } from '../env';

/**
 * JWT payload: the client-facing user plus `tv`, the token version. A token authorizes a request
 * only while `tv` still matches the user's current `token_version` column, which lets the server
 * revoke outstanding tokens by bumping that column. Old tokens predating `tv` default to 0.
 */
export const tokenClaimsSchema = userSchema.extend({ tv: z.number().default(0) });

export type TokenClaims = z.infer<typeof tokenClaimsSchema>;

/** Sign a 7-day JWT for the given user at the given token version. */
export const signToken = (user: User, tokenVersion: number): string =>
  jwt.sign({ ...user, tv: tokenVersion }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });

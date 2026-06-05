import { z } from 'zod';
import { randomBytes } from 'crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const envSchema = z.object({
  // An empty value (e.g. docker-compose `${JWT_SECRET:-}` passthrough) is treated as unset.
  JWT_SECRET: z.preprocess(
    (v) => (typeof v === 'string' && v.length === 0 ? undefined : v),
    z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional()
  ),
  DATA_DIR: z.string().default('./data'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Fatal: invalid environment configuration');
  console.error(result.error.format());
  process.exit(1);
}

const parsed = result.data;

// An explicit JWT_SECRET always wins, so a multi-instance deploy can pin one shared secret. With
// none set, persist a generated one under DATA_DIR (the durable volume) so it stays stable across
// restarts — regenerating per boot would invalidate every outstanding session.
function resolveJwtSecret(dataDir: string, provided: string | undefined): string {
  if (provided) return provided;

  const secretPath = path.join(dataDir, '.jwt_secret');
  try {
    const existing = readFileSync(secretPath, 'utf8').trim();
    if (existing.length >= 32) return existing;
  } catch {
    // first boot — fall through and generate
  }

  const generated = randomBytes(48).toString('base64url');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(secretPath, generated, { mode: 0o600 });
  return generated;
}

export const env = {
  ...parsed,
  JWT_SECRET: resolveJwtSecret(parsed.DATA_DIR, parsed.JWT_SECRET),
};

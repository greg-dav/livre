import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
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

export const env = result.data;

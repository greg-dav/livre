import { z } from 'zod';

export const navigationStateSchema = z.object({ justAcquired: z.boolean() });

import { z } from 'zod';
import { bookMetadataSchema, bookSourceSchema, logEventTypeSchema } from '@livre/types';

/**
 * The shape of one book in the committed demo fixture (`scripts/demoLibrary.generated.ts`), and the
 * reserved username the isolated demo user owns. The fixture is produced offline by
 * `scripts/buildDemoFixture.ts` (metadata + covers resolved from a real source) and consumed at
 * runtime by {@link DemoService}, which seeds these rows under the demo user. Dates are `YYYY-MM-DD`.
 *
 * `events` is the authored reading-log timeline — unlike the import path it carries explicit
 * `started`/`restarted` events so the Timeline's cycle derivation has bars to draw. It must contain
 * at least one event; the seeder additionally guarantees a `shelved` head per the core invariant.
 */
export const DEMO_USERNAME = '__demo__';

const demoEventSchema = z.object({
  event: logEventTypeSchema,
  date: z.string(),
  text: z.string().optional(),
});
export type DemoEvent = z.infer<typeof demoEventSchema>;

export const demoBookSchema = z.object({
  source: bookSourceSchema,
  externalId: z.string(),
  addedDate: z.string(),
  rating: z.number().nullable().optional(),
  review: z.string().optional(),
  metadata: bookMetadataSchema,
  events: z.array(demoEventSchema).min(1),
});
export type DemoBook = z.infer<typeof demoBookSchema>;

export const demoFixtureSchema = z.array(demoBookSchema);
export type DemoFixture = z.infer<typeof demoFixtureSchema>;

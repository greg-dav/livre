import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';
import { z } from 'zod';
import { env } from '../env';

mkdirSync(env.DATA_DIR, { recursive: true });

const db = new Database(path.join(env.DATA_DIR, 'livre.db'));

const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

const pragmaRowSchema = z.object({ name: z.string() });

// Idempotent column migrations for existing databases
const userColumns = z
  .array(pragmaRowSchema)
  .parse(db.prepare("SELECT name FROM pragma_table_info('users')").all())
  .map((r) => r.name);

if (!userColumns.includes('public_key')) {
  db.exec('ALTER TABLE users ADD COLUMN public_key TEXT');
}
if (!userColumns.includes('private_key')) {
  db.exec('ALTER TABLE users ADD COLUMN private_key TEXT');
}

export const inTransaction = <T>(fn: () => T): T => db.transaction(fn)();

export default db;

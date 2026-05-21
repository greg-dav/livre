import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR ?? './data';
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'livre.db'));

const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

export default db;

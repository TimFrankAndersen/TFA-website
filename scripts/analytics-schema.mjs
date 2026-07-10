import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
const url = readFileSync('.env.local','utf8').split('\n').find(l=>l.startsWith('DATABASE_URL=')).split('=').slice(1).join('=').replace(/^["']|["']$/g,'');
const sql = neon(url);
await sql`CREATE TABLE IF NOT EXISTS hits (
  id bigserial PRIMARY KEY,
  ts timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL DEFAULT 'view',
  path text NOT NULL,
  referrer text,
  visitor text NOT NULL,
  country text,
  device text,
  secs int
)`;
await sql`CREATE INDEX IF NOT EXISTS hits_ts_idx ON hits (ts)`;
await sql`CREATE INDEX IF NOT EXISTS hits_path_idx ON hits (path)`;
const r = await sql`SELECT count(*) FROM hits`;
console.log('schema ok, rows:', r[0].count);

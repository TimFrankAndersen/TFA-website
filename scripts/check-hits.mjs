import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
const url = readFileSync('.env.local','utf8').split('\n').find(l=>l.startsWith('DATABASE_URL=')).split('=').slice(1).join('=').replace(/^["']|["']$/g,'');
const sql = neon(url);
const rows = await sql`SELECT kind, path, referrer, country, device, secs FROM hits ORDER BY id DESC LIMIT 8`;
console.log(JSON.stringify(rows, null, 1));

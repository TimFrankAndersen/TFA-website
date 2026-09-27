// One-off backfill of newsletter subscribe/unsubscribe history.
//
// Resend keeps no unsubscribe timestamp, but its email log (about 30 days
// deep) has one row per recipient per edition. A contact that is now
// unsubscribed but received editions was a real subscriber who left after
// the last edition they got - that date is their (approximate) unsubscribe
// day. From here on the Resend webhook (/api/webhooks/resend) records exact
// times. Safe to re-run: it never overwrites what the webhook wrote.
//
// Run: node --env-file=.env.local scripts/newsletter-history.mjs
import { neon } from "@neondatabase/serverless";

const KEY = process.env.RESEND_NEWSLETTER_API_KEY;
const AUDIENCE = process.env.RESEND_AUDIENCE_ID;
if (!KEY || !AUDIENCE || !process.env.DATABASE_URL) {
  console.error("missing RESEND_NEWSLETTER_API_KEY, RESEND_AUDIENCE_ID or DATABASE_URL");
  process.exit(1);
}
const H = { Authorization: `Bearer ${KEY}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS newsletter_contacts (
  email text PRIMARY KEY,
  created_at timestamptz,
  confirmed boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  unsub_approx boolean NOT NULL DEFAULT false,
  first_edition_at timestamptz,
  last_edition_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
)`;
await sql`CREATE INDEX IF NOT EXISTS newsletter_contacts_unsub_idx ON newsletter_contacts (unsubscribed_at)`;
console.log("table ok");

// all contacts (no limit = one response with everything)
const contacts = (await (await fetch(`https://api.resend.com/audiences/${AUDIENCE}/contacts`, { headers: H })).json()).data;
console.log("contacts:", contacts.length);

// every newsletter edition each address received, from the email log
const first = {};
const last = {};
let after = null;
let pages = 0;
for (;;) {
  const res = await fetch(`https://api.resend.com/emails?limit=100${after ? `&after=${after}` : ""}`, { headers: H });
  if (res.status === 429) { await sleep(2000); continue; }
  if (!res.ok) throw new Error(`email log: ${res.status}`);
  const page = await res.json();
  pages++;
  for (const e of page.data) {
    if (!(e.subject ?? "").startsWith("Today in AI")) continue;
    for (const to of [].concat(e.to)) {
      const k = to.trim().toLowerCase();
      if (!first[k] || e.created_at < first[k]) first[k] = e.created_at;
      if (!last[k] || e.created_at > last[k]) last[k] = e.created_at;
    }
  }
  if (!page.has_more || !page.data.length) break;
  after = page.data.at(-1).id;
  await sleep(550); // Resend allows ~2 requests/second
}
console.log("log pages:", pages, "addresses seen:", Object.keys(last).length);

let unsubs = 0;
for (const c of contacts) {
  const email = c.email.trim().toLowerCase();
  const seen = Boolean(last[email]);
  // active contacts have confirmed; so has anyone who received an edition
  const confirmed = !c.unsubscribed || seen;
  const unsubAt = c.unsubscribed && seen ? last[email] : null;
  if (unsubAt) unsubs++;
  await sql`INSERT INTO newsletter_contacts
      (email, created_at, confirmed, unsubscribed_at, unsub_approx, first_edition_at, last_edition_at)
    VALUES (${email}, ${c.created_at}, ${confirmed}, ${unsubAt}, ${Boolean(unsubAt)},
      ${first[email] ?? null}, ${last[email] ?? null})
    ON CONFLICT (email) DO UPDATE SET
      created_at = coalesce(newsletter_contacts.created_at, EXCLUDED.created_at),
      confirmed = newsletter_contacts.confirmed OR EXCLUDED.confirmed,
      unsub_approx = CASE WHEN newsletter_contacts.unsubscribed_at IS NULL
        THEN EXCLUDED.unsub_approx ELSE newsletter_contacts.unsub_approx END,
      unsubscribed_at = coalesce(newsletter_contacts.unsubscribed_at, EXCLUDED.unsubscribed_at),
      first_edition_at = least(newsletter_contacts.first_edition_at, EXCLUDED.first_edition_at),
      last_edition_at = greatest(newsletter_contacts.last_edition_at, EXCLUDED.last_edition_at),
      updated_at = now()`;
}

const [s] = await sql`SELECT count(*) AS rows,
  count(*) FILTER (WHERE unsubscribed_at IS NOT NULL) AS unsubscribed,
  count(*) FILTER (WHERE confirmed) AS confirmed,
  min(first_edition_at) AS tracked_since
  FROM newsletter_contacts`;
console.log("unsubscribes found this run:", unsubs);
console.log("table:", JSON.stringify(s));

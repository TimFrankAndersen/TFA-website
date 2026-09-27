import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db, dbConfigured } from "@/lib/db";

/**
 * Resend webhook (contact.created / contact.updated): keeps the
 * newsletter_contacts history that Resend itself does not keep.
 *
 * Double opt-in means a contact starts as unsubscribed and flips to
 * subscribed when they confirm. So a flip to subscribed = confirmed_at,
 * and a flip back to unsubscribed only counts as an unsubscribe for a
 * contact that had confirmed - a never-confirmed signup is not a loss.
 * Payloads are signed with Svix (HMAC-SHA256). Older history was
 * backfilled by scripts/newsletter-history.mjs.
 */

const TOLERANCE_SECONDS = 300;

function validSignature(req: NextRequest, body: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET ?? "";
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const header = req.headers.get("svix-signature");
  if (!secret || !id || !timestamp || !header) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto
    .createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");

  return header.split(" ").some((part) => {
    const sig = part.split(",")[1] ?? "";
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

function iso(value: string | undefined, fallback: Date): string {
  const d = new Date(value ?? "");
  return (Number.isNaN(d.getTime()) ? fallback : d).toISOString();
}

export async function POST(req: NextRequest) {
  if (!dbConfigured() || !process.env.RESEND_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const body = await req.text();
  if (!validSignature(req, body)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: {
    type?: string;
    created_at?: string;
    data?: {
      audience_id?: string;
      email?: string;
      unsubscribed?: boolean;
      created_at?: string;
      updated_at?: string;
    };
  };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const data = event.data;
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (
    (event.type !== "contact.created" && event.type !== "contact.updated") ||
    !data?.email ||
    typeof data.unsubscribed !== "boolean" ||
    (audience && data.audience_id && data.audience_id !== audience)
  ) {
    return NextResponse.json({ ok: true });
  }

  const email = data.email.trim().toLowerCase();
  const unsub = data.unsubscribed;
  const now = new Date();
  const created = iso(data.created_at, now);
  const at = iso(data.updated_at ?? event.created_at, now);

  try {
    const sql = db();
    // The WHERE guard drops retried events that arrive out of order.
    await sql`INSERT INTO newsletter_contacts
        (email, created_at, confirmed, confirmed_at, updated_at)
      VALUES (${email}, ${created}, ${!unsub}, ${unsub ? null : at}, ${at})
      ON CONFLICT (email) DO UPDATE SET
        created_at = coalesce(newsletter_contacts.created_at, EXCLUDED.created_at),
        confirmed = newsletter_contacts.confirmed OR NOT ${unsub},
        confirmed_at = CASE WHEN NOT ${unsub}
          THEN coalesce(newsletter_contacts.confirmed_at, EXCLUDED.confirmed_at)
          ELSE newsletter_contacts.confirmed_at END,
        unsubscribed_at = CASE
          WHEN NOT ${unsub} THEN NULL
          WHEN newsletter_contacts.confirmed AND newsletter_contacts.unsubscribed_at IS NULL THEN ${at}::timestamptz
          ELSE newsletter_contacts.unsubscribed_at END,
        unsub_approx = CASE
          WHEN NOT ${unsub} THEN false
          WHEN newsletter_contacts.confirmed AND newsletter_contacts.unsubscribed_at IS NULL THEN false
          ELSE newsletter_contacts.unsub_approx END,
        updated_at = EXCLUDED.updated_at
      WHERE newsletter_contacts.updated_at <= EXCLUDED.updated_at`;
  } catch (err) {
    console.error("[resend-webhook] upsert failed:", err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

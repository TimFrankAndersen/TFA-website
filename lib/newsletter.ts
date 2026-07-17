import crypto from "crypto";

/**
 * Newsletter plumbing (server-only): Resend Audience contacts + the
 * double-opt-in confirmation flow. Uses the dedicated Resend account
 * for timfrankandersen.com (separate from the booking-form account).
 */

const RESEND_API = "https://api.resend.com";

function apiKey(): string {
  return process.env.RESEND_NEWSLETTER_API_KEY ?? "";
}
function audienceId(): string {
  return process.env.RESEND_AUDIENCE_ID ?? "";
}

export function isConfigured(): boolean {
  return Boolean(apiKey() && audienceId() && process.env.NEWSLETTER_SECRET);
}

/* ------------------------------------------------------------------ */
/* Confirmation tokens (HMAC of the email, no server-side state)       */
/* ------------------------------------------------------------------ */

export function confirmToken(email: string): string {
  return crypto
    .createHmac("sha256", process.env.NEWSLETTER_SECRET ?? "")
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

export function tokenValid(email: string, token: string): boolean {
  const expected = confirmToken(email);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ------------------------------------------------------------------ */
/* Resend Audience contacts                                            */
/* ------------------------------------------------------------------ */

async function resend(path: string, method: string, body?: unknown) {
  const res = await fetch(`${RESEND_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: res.ok, status: res.status, json: await res.json().catch(() => null) };
}

/** Adds (or re-adds) a contact as unsubscribed until they confirm. */
export async function addPendingContact(email: string) {
  return resend(`/audiences/${audienceId()}/contacts`, "POST", {
    email: email.trim().toLowerCase(),
    unsubscribed: true,
  });
}

/** Flips a confirmed contact to subscribed. */
export async function activateContact(email: string) {
  return resend(
    `/audiences/${audienceId()}/contacts/${encodeURIComponent(email.trim().toLowerCase())}`,
    "PATCH",
    { unsubscribed: false }
  );
}

/* ------------------------------------------------------------------ */
/* Confirmation email                                                  */
/* ------------------------------------------------------------------ */

export async function sendConfirmEmail(email: string, baseUrl: string) {
  const url = `${baseUrl}/api/confirm?e=${encodeURIComponent(
    email.trim().toLowerCase()
  )}&t=${confirmToken(email)}`;

  const html = `
<div style="margin:0;padding:0;background:#FBF7EF">
  <div style="max-width:560px;margin:0 auto;padding:44px 24px;font-family:Helvetica,Arial,sans-serif;color:#141414">
    <p style="font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1E4B3A;margin:0 0 18px">
      &#9632;&nbsp; Daily AI news
    </p>
    <h1 style="font-size:26px;line-height:1.2;margin:0 0 16px;font-weight:700">
      One click and you're in
    </h1>
    <p style="font-size:16px;line-height:1.6;margin:0 0 28px">
      You asked for the five AI news stories that matter, every morning,
      picked by Tim Frank Andersen. Confirm your email and the first one
      arrives tomorrow.
    </p>
    <a href="${url}"
       style="display:inline-block;background:#1E4B3A;color:#FBF7EF;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px">
      Confirm subscription &rarr;
    </a>
    <p style="font-size:12px;line-height:1.6;color:#8a877f;margin:34px 0 0">
      You are getting this because someone entered your address at
      timfrankandersen.com. If it wasn't you, just ignore this email -
      you won't hear from us again.
    </p>
  </div>
</div>`;

  return resend("/emails", "POST", {
    from: process.env.NEWSLETTER_FROM ?? "news@timfrankandersen.com",
    // news@ is send-only (no inbound MX on the domain) - replies must
    // land in Tim's real inbox or they bounce with "No such user here".
    reply_to: process.env.NEWSLETTER_REPLY_TO ?? "tim@frankandersen.com",
    to: email.trim().toLowerCase(),
    subject: "Confirm your subscription - daily AI news from Tim",
    html,
  });
}

import { NextRequest, NextResponse } from "next/server";
import {
  isConfigured,
  addPendingContact,
  sendConfirmEmail,
} from "@/lib/newsletter";
import { rateLimited, clientIp } from "@/lib/ratelimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let body: { email?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (body.website) return NextResponse.json({ ok: true });

  // Max 10 signup attempts per IP per hour (each one sends a confirm email).
  if (await rateLimited("subscribe", clientIp(req), 10, 3600)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const contact = await addPendingContact(email);
  if (!contact.ok && contact.status !== 409) {
    // 409 = already a contact (fine - maybe re-requesting the confirm mail)
    console.error("[newsletter] contact create failed:", contact.status);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const sent = await sendConfirmEmail(email, base);
  if (!sent.ok) {
    console.error("[newsletter] confirm email failed:", sent.status);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

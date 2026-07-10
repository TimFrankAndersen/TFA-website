import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db, dbConfigured } from "@/lib/db";

/**
 * Cookieless, anonymous page-view collector (Plausible-style):
 * the visitor id is a salted daily hash of IP + user agent - raw IP and
 * UA are never stored, and the hash cannot be reversed or linked across
 * days. No cookies, no consent banner needed.
 */

const BOT_RE =
  /bot|crawler|spider|crawling|headless|lighthouse|pingdom|uptime|monitor|preview|scan|curl|wget|python-requests/i;

function dailyVisitorHash(ip: string, ua: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.NEWSLETTER_SECRET ?? "tfa";
  return crypto
    .createHash("sha256")
    .update(`${salt}|${day}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 16);
}

function refHost(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host.includes("timfrankandersen.com") ? null : host;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!dbConfigured()) return NextResponse.json({ ok: false }, { status: 503 });

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT_RE.test(ua)) return NextResponse.json({ ok: true });

  let body: { path?: string; ref?: string; kind?: string; secs?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = (body.path ?? "").slice(0, 200);
  if (!path.startsWith("/") || path.startsWith("/dashboard")) {
    return NextResponse.json({ ok: true });
  }
  const kind = body.kind === "leave" ? "leave" : "view";
  const secs =
    kind === "leave" && Number.isFinite(body.secs)
      ? Math.min(Math.max(Math.round(body.secs as number), 0), 3600)
      : null;

  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";
  const visitor = dailyVisitorHash(ip, ua);
  const country = req.headers.get("x-vercel-ip-country");
  const device = /mobile|iphone|android/i.test(ua) ? "mobile" : "desktop";

  try {
    const sql = db();
    await sql`INSERT INTO hits (kind, path, referrer, visitor, country, device, secs)
      VALUES (${kind}, ${path}, ${refHost(body.ref)}, ${visitor}, ${country}, ${device}, ${secs})`;
  } catch (err) {
    console.error("[hit] insert failed:", err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

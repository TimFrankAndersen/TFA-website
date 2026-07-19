import { NextResponse } from "next/server";
import { rateLimited, clientIp } from "@/lib/ratelimit";

/**
 * Booking enquiry endpoint.
 *
 * PRODUCTION: forward the enquiry to Tim by email. Recommended: Resend
 * (resend.com) - set RESEND_API_KEY in Vercel env vars and uncomment below.
 * Until then, enquiries are logged server-side and the form shows the
 * direct email address as a fallback.
 */
export async function POST(req: Request) {
  const data = await req.json().catch(() => null);
  if (!data || typeof data.email !== "string" || typeof data.name !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Bot defence 1: honeypot - real visitors never fill the hidden field.
  // Bot defence 2: time gate - humans take more than 4s to fill the form.
  // Both return a fake success so bots have nothing to adapt to.
  const elapsed = Date.now() - Number(data.t ?? 0);
  if (data.website || !data.t || elapsed < 4000) {
    console.log("[enquiry] bot dropped (honeypot/time-gate)");
    return NextResponse.json({ ok: true });
  }

  // Bot defence 3: max 5 enquiries per IP per hour.
  if (await rateLimited("enquiry", clientIp(req), 5, 3600)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Must be an address on a Resend-verified domain.
        // Until timfrankandersen.com is verified, use the aicurriculum.dk
        // domain via the ENQUIRY_FROM env var.
        from: process.env.ENQUIRY_FROM || "enquiry@timfrankandersen.com",
        to: ["tim@frankandersen.com"],
        reply_to: data.email,
        subject: `Booking enquiry: ${data.name}${data.organisation ? ` (${data.organisation})` : ""}`,
        text: [
          `Name: ${data.name}`,
          `Email: ${data.email}`,
          `Organisation: ${data.organisation || "-"}`,
          `Event date: ${data.date || "-"}`,
          `Audience / context: ${data.audience || "-"}`,
          `Format: ${data.format || "-"}`,
          "",
          data.message || "",
        ].join("\n"),
      }),
    });
    if (!res.ok) {
      // Log the upstream error for Vercel function logs, and surface the
      // upstream status (no secrets) so failures are diagnosable:
      // 401 = bad API key, 403 = from-address domain not verified.
      const err = await res.text().catch(() => "");
      console.error("[enquiry] Resend rejected:", res.status, err);
      return NextResponse.json(
        { ok: false, upstream: res.status },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  console.log("[enquiry] (no RESEND_API_KEY set - logging only)", data);
  return NextResponse.json({ ok: true });
}

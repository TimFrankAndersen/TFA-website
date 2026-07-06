import { NextResponse } from "next/server";

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

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "enquiry@timfrankandersen.com",
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
    return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
  }

  console.log("[enquiry] (no RESEND_API_KEY set - logging only)", data);
  return NextResponse.json({ ok: true });
}

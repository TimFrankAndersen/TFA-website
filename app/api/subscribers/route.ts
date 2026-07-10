import { NextRequest, NextResponse } from "next/server";

/** CSV export of all active newsletter subscribers (dashboard-key protected). */
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const apiKey = process.env.RESEND_NEWSLETTER_API_KEY;
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audience) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const res = await fetch(
    `https://api.resend.com/audiences/${audience}/contacts`,
    { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
  );
  if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 });

  type Contact = { email: string; unsubscribed: boolean; created_at: string };
  const contacts: Contact[] = (await res.json()).data ?? [];
  const rows = contacts
    .filter((c) => !c.unsubscribed)
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    .map((c) => `${c.email},${c.created_at.slice(0, 10)}`);

  const csv = `email,tilmeldt\n${rows.join("\n")}\n`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="abonnenter-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

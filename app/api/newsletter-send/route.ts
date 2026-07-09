import { NextRequest, NextResponse } from "next/server";
import { getNewsDays } from "@/lib/content";
import { isConfigured } from "@/lib/newsletter";

/**
 * Daily newsletter sender, triggered by Vercel Cron (see vercel.json):
 * once at 06:00 UTC and a catch-up at 08:30 UTC for days where the
 * morning pipeline needed its retry. A named broadcast per day
 * ("daily-YYYY-MM-DD") makes the send idempotent - if the name already
 * exists, we skip.
 */

const RESEND_API = "https://api.resend.com";

function headers() {
  return {
    Authorization: `Bearer ${process.env.RESEND_NEWSLETTER_API_KEY}`,
    "Content-Type": "application/json",
  };
}

function copenhagenTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Copenhagen",
  }).format(new Date());
}

function renderEmail(dateLabel: string, stories: { h: string; p: string }[]) {
  const mono = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";
  const items = stories
    .map(
      (s, i) => `
    <tr>
      <td style="vertical-align:baseline;padding:22px 18px 0 0;font-family:${mono};font-size:22px;font-weight:700;color:#1E4B3A">
        ${String(i + 1).padStart(2, "0")}
      </td>
      <td style="padding:22px 0 0">
        <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:17px;font-weight:700;line-height:1.35;color:#141414">${s.h}</p>
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#5c594f">${s.p}</p>
      </td>
    </tr>`
    )
    .join("");

  return `
<div style="margin:0;padding:0;background:#FBF7EF">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <p style="font-family:${mono};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1E4B3A;margin:0 0 10px">
      &#9632;&nbsp; Today in AI &middot; ${dateLabel}
    </p>
    <h1 style="font-family:Helvetica,Arial,sans-serif;font-size:24px;line-height:1.2;margin:0 0 8px;color:#141414;font-weight:700">
      The 5 stories that matter
    </h1>
    <p style="font-family:${mono};font-size:11px;letter-spacing:1px;color:#8a877f;margin:0 0 8px">
      Curated by Tim Frank Andersen
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${items}</table>
    <p style="margin:34px 0 0">
      <a href="https://www.timfrankandersen.com/news"
         style="font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#1E4B3A">
        Read on the site &rarr;</a>
    </p>
    <p style="font-family:${mono};font-size:10px;letter-spacing:.5px;line-height:1.7;color:#8a877f;margin:36px 0 0;border-top:1px solid #e5e0d5;padding-top:16px">
      You get this because you signed up at
      <a href="https://www.timfrankandersen.com" style="color:#8a877f">timfrankandersen.com</a>.
      &nbsp;<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#8a877f">Unsubscribe</a>
    </p>
  </div>
</div>`;
}

export async function GET(req: NextRequest) {
  // Vercel Cron authenticates with CRON_SECRET; manual runs must match it.
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json({ ok: false, reason: "not configured" }, { status: 503 });
  }

  // 1. Today's stories (same source as the site).
  const days = await getNewsDays();
  const today = days[0];
  if (!today?.isToday || today.stories.length === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: "no stories for today yet" });
  }

  // 2. Idempotency: one named broadcast per Copenhagen day.
  const name = `daily-${copenhagenTodayISO()}`;
  const list = await fetch(`${RESEND_API}/broadcasts`, { headers: headers() }).then((r) => r.json());
  if ((list.data ?? []).some((b: { name?: string }) => b.name === name)) {
    return NextResponse.json({ ok: true, sent: false, reason: "already sent today" });
  }

  // 3. Create + send the broadcast.
  const create = await fetch(`${RESEND_API}/broadcasts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name,
      audience_id: process.env.RESEND_AUDIENCE_ID,
      from: process.env.NEWSLETTER_FROM ?? "news@timfrankandersen.com",
      subject: `Today in AI: ${today.stories[0].h}`,
      html: renderEmail(today.date, today.stories),
    }),
  });
  const created = await create.json();
  if (!create.ok || !created.id) {
    console.error("[newsletter] broadcast create failed:", created);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  const send = await fetch(`${RESEND_API}/broadcasts/${created.id}/send`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({}),
  });
  if (!send.ok) {
    console.error("[newsletter] broadcast send failed:", await send.text());
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sent: true, broadcast: created.id, name });
}

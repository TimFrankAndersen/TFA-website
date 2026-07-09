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

function renderEmail(
  dateLabel: string,
  stories: { h: string; p: string }[],
  assetBase = "https://www.timfrankandersen.com"
) {
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
  <div style="max-width:600px;margin:0 auto;padding:36px 24px;">
    <!-- masthead -->
    <div style="text-align:center">
      <img src="${assetBase}/images/newsletter-portrait.jpg" width="84" height="84" alt="Tim Frank Andersen"
           style="display:inline-block;border-radius:50%;border:3px solid #1E4B3A" />
      <div style="width:64px;height:1px;background:#141414;margin:18px auto 16px"></div>
      <h1 style="font-family:Helvetica,Arial,sans-serif;font-size:26px;line-height:1.15;margin:0 0 10px;color:#141414;font-weight:700">
        5 AI stories that matter
      </h1>
      <p style="font-family:${mono};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1E4B3A;margin:0 0 4px">
        &#9632;&nbsp; Today in AI &middot; ${dateLabel}
      </p>
      <p style="font-family:${mono};font-size:11px;letter-spacing:1px;color:#8a877f;margin:0 0 6px">
        Curated by Tim Frank Andersen
      </p>
    </div>
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

  // Test mode (?test=1): one-off email to the owner, bypassing the
  // broadcast + dedup, for judging template changes in a real inbox.
  const params = new URL(req.url).searchParams;
  if (params.get("test") === "1") {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        from: process.env.NEWSLETTER_FROM ?? "news@timfrankandersen.com",
        to: "tim@frankandersen.com",
        subject: `[TEST] Today in AI: ${today.stories[0].h}`,
        html: renderEmail(
          today.date,
          today.stories,
          params.get("base") ?? undefined
        ).replace("{{{RESEND_UNSUBSCRIBE_URL}}}", "#"),
      }),
    });
    return NextResponse.json({ ok: res.ok, test: true });
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

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
  // Font stacks mirror the site: --display/--body and --mono in globals.css
  const sans = "-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif";
  const mono = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";
  const items = stories
    .map(
      (s, i) => `
    <tr>
      <td style="vertical-align:baseline;padding:22px 18px 0 0;font-family:${mono};font-size:22px;font-weight:700;color:#1E4B3A">
        ${String(i + 1).padStart(2, "0")}
      </td>
      <td style="padding:22px 0 0">
        <p style="margin:0 0 6px;font-family:${sans};font-size:17px;font-weight:700;letter-spacing:-.01em;line-height:1.35;color:#141414">${s.h}</p>
        <p style="margin:0;font-family:${sans};font-size:15px;line-height:1.55;color:#5c594f">${s.p}</p>
      </td>
    </tr>`
    )
    .join("");

  return `
<div style="margin:0;padding:0;background:#FBF7EF">
  <div style="max-width:600px;margin:0 auto;padding:0 0 36px;">
    <!-- masthead: photo strip, then site-style label + headline -->
    <img src="${assetBase}/images/newsletter-banner.jpg" width="600" alt="Tim Frank Andersen"
         style="display:block;width:100%;height:auto" />
    <div style="padding:26px 24px 0">
      <p style="font-family:${mono};font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#1E4B3A;margin:0 0 12px">
        &#9632;&nbsp; Today in AI &middot; ${dateLabel}
      </p>
      <h1 style="font-family:${sans};font-size:30px;letter-spacing:-.03em;line-height:1.05;margin:0 0 10px;color:#141414;font-weight:700">
        5 AI stories that matter
      </h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 18px">
        <tr>
          <td style="font-family:${mono};font-size:11px;font-weight:600;letter-spacing:1px;color:#8a877f;vertical-align:baseline">
            Curated by Tim Frank Andersen
          </td>
          <td align="right" style="vertical-align:baseline">
            <a href="https://www.timfrankandersen.com/news"
               style="font-family:${sans};font-size:13px;font-weight:700;color:#1E4B3A;text-decoration:none;white-space:nowrap">
              Read on the site &rarr;</a>
          </td>
        </tr>
      </table>
      <div style="height:1px;background:#e5e0d5"></div>
    </div>
    <div style="padding:0 24px">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${items}</table>

      <!-- CTA row: comment lands in Tim's inbox; share opens a ready-made
           mail in the reader's own client (personal recommendation) -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:36px 0 0">
        <tr>
          <td style="padding-right:12px">
            <a href="mailto:tim@frankandersen.com?subject=${encodeURIComponent("Comment on today's newsletter")}"
               style="display:inline-block;background:#1E4B3A;color:#FBF7EF;font-family:${sans};font-size:14px;font-weight:700;text-decoration:none;padding:13px 22px">
              Comment on this newsletter</a>
          </td>
          <td>
            <a href="mailto:?subject=${encodeURIComponent("The 5 AI stories that matter - every morning")}&body=${encodeURIComponent("I get the 5 most important AI news stories every morning, curated by Tim Frank Andersen. Free and takes two minutes to read. Sign up here: https://www.timfrankandersen.com")}"
               style="display:inline-block;background:#1E4B3A;color:#FBF7EF;font-family:${sans};font-size:14px;font-weight:700;text-decoration:none;padding:13px 22px">
              Share with a friend</a>
          </td>
        </tr>
      </table>

      <p style="font-family:${sans};font-size:13px;font-weight:700;line-height:1.5;color:#141414;margin:34px 0 0">
        Want to go deeper on AI? Explore
        <a href="https://www.timfrankandersen.com/curriculum"
           style="color:#1E4B3A;text-decoration:underline">AI Curriculum</a>,
        the platform I built for leaders.
      </p>
      <p style="font-family:${mono};font-size:10px;letter-spacing:.5px;line-height:1.7;color:#8a877f;margin:36px 0 0;border-top:1px solid #e5e0d5;padding-top:16px">
        You get this because you signed up at
        <a href="https://www.timfrankandersen.com" style="color:#8a877f">timfrankandersen.com</a>.
        &nbsp;<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#8a877f">Unsubscribe</a>
        <br />Got this forwarded? <a href="https://www.timfrankandersen.com" style="color:#1E4B3A">Get your own daily 5 &rarr;</a>
      </p>
    </div>
  </div>
</div>`;
}

export async function GET(req: NextRequest) {
  // Vercel Cron authenticates with CRON_SECRET (Bearer header); manual runs
  // and the browser preview may pass it as ?key= instead.
  const params = new URL(req.url).searchParams;
  const secret = process.env.CRON_SECRET;
  const authed =
    Boolean(secret) &&
    (req.headers.get("authorization") === `Bearer ${secret}` ||
      params.get("key") === secret);
  if (!authed) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json({ ok: false, reason: "not configured" }, { status: 503 });
  }

  // 1. Today's stories (same source as the site).
  const days = await getNewsDays();
  const today = days[0];

  // Preview mode (?preview=1): render the email as an HTML page for visual
  // review, using the latest available day so it always shows an example.
  if (params.get("preview") === "1") {
    const day = today ?? days[0];
    const html = renderEmail(
      day.date,
      day.stories,
      params.get("base") ?? undefined
    ).replace("{{{RESEND_UNSUBSCRIBE_URL}}}", "#");
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!today?.isToday || today.stories.length === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: "no stories for today yet" });
  }

  // Test mode (?test=1): one-off email to the owner, bypassing the
  // broadcast + dedup, for judging template changes in a real inbox.
  if (params.get("test") === "1") {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        from: process.env.NEWSLETTER_FROM ?? "news@timfrankandersen.com",
        reply_to: process.env.NEWSLETTER_REPLY_TO ?? "tim@frankandersen.com",
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
      reply_to: process.env.NEWSLETTER_REPLY_TO ?? "tim@frankandersen.com",
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

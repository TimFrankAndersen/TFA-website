import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

// Always fresh - this is Tim's own control room.
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>;

async function analytics() {
  const sql = db();
  const [kpis, visit, days, hours, pages, refs, countries, devices] =
    await Promise.all([
      sql`SELECT
        count(*) FILTER (WHERE kind='view' AND (ts AT TIME ZONE 'Europe/Copenhagen')::date = (now() AT TIME ZONE 'Europe/Copenhagen')::date) AS views_today,
        count(DISTINCT visitor) FILTER (WHERE kind='view' AND (ts AT TIME ZONE 'Europe/Copenhagen')::date = (now() AT TIME ZONE 'Europe/Copenhagen')::date) AS visitors_today,
        count(*) FILTER (WHERE kind='view' AND ts >= now() - interval '7 days') AS views_7d,
        count(DISTINCT visitor) FILTER (WHERE kind='view' AND ts >= now() - interval '7 days') AS visitors_7d,
        count(*) FILTER (WHERE kind='view' AND ts >= now() - interval '30 days') AS views_30d,
        count(DISTINCT visitor) FILTER (WHERE kind='view' AND ts >= now() - interval '30 days') AS visitors_30d,
        count(*) FILTER (WHERE kind='view') AS views_total,
        count(DISTINCT visitor) FILTER (WHERE kind='view') AS visitors_total,
        round(avg(secs) FILTER (WHERE kind='leave' AND secs > 0 AND ts >= now() - interval '7 days')) AS avg_secs
      FROM hits`,
      sql`SELECT round(avg(s)) AS avg_visit_secs FROM (
        SELECT visitor, sum(secs) AS s FROM hits
        WHERE kind='leave' AND secs > 0 AND ts >= now() - interval '7 days'
        GROUP BY visitor, (ts AT TIME ZONE 'Europe/Copenhagen')::date
      ) t`,
      sql`SELECT to_char((ts AT TIME ZONE 'Europe/Copenhagen')::date, 'DD Mon') AS day,
        count(*) FILTER (WHERE kind='view') AS views,
        count(DISTINCT visitor) FILTER (WHERE kind='view') AS visitors
      FROM hits WHERE ts >= now() - interval '14 days'
      GROUP BY (ts AT TIME ZONE 'Europe/Copenhagen')::date ORDER BY (ts AT TIME ZONE 'Europe/Copenhagen')::date`,
      sql`SELECT extract(hour FROM ts AT TIME ZONE 'Europe/Copenhagen')::int AS hour, count(*) AS views
      FROM hits WHERE kind='view' AND ts >= now() - interval '7 days'
      GROUP BY 1 ORDER BY 1`,
      sql`SELECT path, count(*) AS views, count(DISTINCT visitor) AS visitors,
        round(avg(secs) FILTER (WHERE kind='leave' AND secs > 0)) AS avg_secs
      FROM hits WHERE kind <> 'click' AND ts >= now() - interval '30 days'
      GROUP BY path ORDER BY count(*) FILTER (WHERE kind='view') DESC LIMIT 10`,
      sql`SELECT referrer, count(*) AS views FROM hits
      WHERE kind='view' AND referrer IS NOT NULL AND ts >= now() - interval '30 days'
      GROUP BY referrer ORDER BY 2 DESC LIMIT 10`,
      sql`SELECT country, count(DISTINCT visitor) AS visitors FROM hits
      WHERE kind='view' AND country IS NOT NULL AND ts >= now() - interval '30 days'
      GROUP BY country ORDER BY 2 DESC LIMIT 10`,
      sql`SELECT device, count(DISTINCT visitor) AS visitors FROM hits
      WHERE kind='view' AND ts >= now() - interval '30 days' GROUP BY device`,
    ]);
  return {
    kpis: { ...(kpis[0] as Row), ...(visit[0] as Row) },
    days, hours, pages, refs, countries, devices,
  };
}

async function newsletter() {
  const key = process.env.RESEND_NEWSLETTER_API_KEY;
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audience) return null;
  const headers = { Authorization: `Bearer ${key}` };
  try {
    const [contactsRes, broadcastsRes] = await Promise.all([
      fetch(`https://api.resend.com/audiences/${audience}/contacts`, { headers, cache: "no-store" }),
      fetch(`https://api.resend.com/broadcasts`, { headers, cache: "no-store" }),
    ]);
    const contacts = (await contactsRes.json()).data ?? [];
    const broadcasts = ((await broadcastsRes.json()).data ?? [])
      .filter((b: Row) => String(b.name ?? "").startsWith("daily-"))
      .slice(0, 7);
    type Contact = { email: string; unsubscribed: boolean; created_at: string };
    const active = (contacts as Contact[]).filter((c) => !c.unsubscribed);
    const last24h = active.filter(
      (c) => Date.now() - new Date(c.created_at).getTime() < 86400e3
    );
    const last14 = active.filter(
      (c) => Date.now() - new Date(c.created_at).getTime() < 14 * 86400e3
    );
    const newest = [...active]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 8);
    const flagged = (contacts as Contact[]).filter((c) => c.unsubscribed);
    return { total: active.length, flagged, last24h: last24h.length, last14: last14.length, newest, broadcasts };
  } catch {
    return null;
  }
}

/**
 * Clicks through to the news stories' sources, next to visits that came
 * from the newsletter (?ref=newsletter). Tells Tim whether readers want the
 * source links, i.e. whether they belong in the mail itself.
 */
async function sourceClicks() {
  try {
    const sql = db();
    const [kpis, days, hosts] = await Promise.all([
      sql`SELECT
        count(*) FILTER (WHERE kind='click' AND (ts AT TIME ZONE 'Europe/Copenhagen')::date = (now() AT TIME ZONE 'Europe/Copenhagen')::date) AS clicks_today,
        count(DISTINCT visitor) FILTER (WHERE kind='click' AND (ts AT TIME ZONE 'Europe/Copenhagen')::date = (now() AT TIME ZONE 'Europe/Copenhagen')::date) AS clickers_today,
        count(DISTINCT visitor) FILTER (WHERE kind='view' AND referrer='newsletter' AND (ts AT TIME ZONE 'Europe/Copenhagen')::date = (now() AT TIME ZONE 'Europe/Copenhagen')::date) AS nl_today,
        count(*) FILTER (WHERE kind='click' AND ts >= now() - interval '7 days') AS clicks_7d,
        count(DISTINCT visitor) FILTER (WHERE kind='view' AND referrer='newsletter' AND ts >= now() - interval '7 days') AS nl_7d
      FROM hits WHERE kind IN ('click','view') AND ts >= now() - interval '8 days'`,
      sql`SELECT to_char(d, 'DD Mon') AS day,
        count(DISTINCT h.visitor) FILTER (WHERE h.kind='view' AND h.referrer='newsletter') AS nl,
        count(DISTINCT h.visitor) FILTER (WHERE h.kind='click') AS clickers,
        count(h.id) FILTER (WHERE h.kind='click') AS clicks
      FROM generate_series(
        (now() AT TIME ZONE 'Europe/Copenhagen')::date - 13,
        (now() AT TIME ZONE 'Europe/Copenhagen')::date,
        interval '1 day') AS d
      LEFT JOIN hits h
        ON (h.ts AT TIME ZONE 'Europe/Copenhagen')::date = d::date
        AND h.kind IN ('click','view')
      GROUP BY d ORDER BY d DESC`,
      sql`SELECT referrer AS host, count(*) AS clicks FROM hits
      WHERE kind='click' AND referrer IS NOT NULL AND ts >= now() - interval '30 days'
      GROUP BY referrer ORDER BY 2 DESC LIMIT 10`,
    ]);
    return { kpis: kpis[0] as Row, days: days as Row[], hosts: hosts as Row[] };
  } catch (err) {
    console.error("[dashboard] source clicks failed:", err);
    return null;
  }
}

// Time as a subscriber: from confirming (or signing up, for backfilled
// rows where the confirm time is unknown) to unsubscribing, in days.
const DAYS_SUBSCRIBED = "extract(epoch FROM unsubscribed_at - coalesce(confirmed_at, created_at)) / 86400";

const DURATION_BUCKETS = ["Under 1 uge", "1-2 uger", "2-4 uger", "1-2 mdr", "2+ mdr"];

/** Unsubscribe history from newsletter_contacts (Resend keeps none). */
async function unsubscribes() {
  try {
    const sql = db();
    const [kpis, median, buckets, weeks, recent, meta] = await Promise.all([
      sql`SELECT
        count(*) FILTER (WHERE unsubscribed_at >= now() - interval '7 days') AS d7,
        count(*) FILTER (WHERE unsubscribed_at >= now() - interval '30 days') AS d30,
        count(*) FILTER (WHERE unsubscribed_at IS NOT NULL) AS total
        FROM newsletter_contacts`,
      sql.query(`SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY ${DAYS_SUBSCRIBED}) AS days
        FROM newsletter_contacts WHERE unsubscribed_at IS NOT NULL`),
      sql.query(`SELECT CASE WHEN d < 7 THEN 0 WHEN d < 14 THEN 1 WHEN d < 30 THEN 2 WHEN d < 60 THEN 3 ELSE 4 END AS b,
        count(*) AS n
        FROM (SELECT ${DAYS_SUBSCRIBED} AS d FROM newsletter_contacts WHERE unsubscribed_at IS NOT NULL) x
        GROUP BY 1`),
      sql`SELECT to_char(w, 'DD/MM') AS week, count(c.email) AS n
        FROM generate_series(
          date_trunc('week', (SELECT min(first_edition_at) FROM newsletter_contacts) AT TIME ZONE 'Europe/Copenhagen'),
          date_trunc('week', now() AT TIME ZONE 'Europe/Copenhagen'),
          interval '1 week') AS w
        LEFT JOIN newsletter_contacts c
          ON date_trunc('week', c.unsubscribed_at AT TIME ZONE 'Europe/Copenhagen') = w
        GROUP BY w ORDER BY w`,
      sql.query(`SELECT email,
        to_char(created_at AT TIME ZONE 'Europe/Copenhagen', 'DD/MM') AS tilmeldt,
        to_char(unsubscribed_at AT TIME ZONE 'Europe/Copenhagen', 'DD/MM') AS afmeldt,
        unsub_approx,
        round(${DAYS_SUBSCRIBED}) AS dage
        FROM newsletter_contacts WHERE unsubscribed_at IS NOT NULL
        ORDER BY unsubscribed_at DESC LIMIT 12`),
      sql`SELECT min(first_edition_at) AS since,
        to_char(min(first_edition_at) AT TIME ZONE 'Europe/Copenhagen', 'DD/MM') AS since_label,
        count(*) FILTER (WHERE NOT confirmed AND created_at < (SELECT min(first_edition_at) FROM newsletter_contacts)) AS unknown
        FROM newsletter_contacts`,
      ]);
    const k = kpis[0] as Row;
    const m = meta[0] as Row;
    const byBucket = new Map((buckets as Row[]).map((r) => [Number(r.b), Number(r.n)]));
    return {
      d7: Number(k.d7 ?? 0),
      d30: Number(k.d30 ?? 0),
      total: Number(k.total ?? 0),
      medianDays: median[0]?.days == null ? null : Math.round(Number(median[0].days)),
      buckets: DURATION_BUCKETS.map((label, i) => ({ label, n: byBucket.get(i) ?? 0 })),
      weeks: weeks as Row[],
      recent: recent as Row[],
      since: m.since ? new Date(String(m.since)) : null,
      sinceLabel: String(m.since_label ?? ""),
      unknown: Number(m.unknown ?? 0),
    };
  } catch (err) {
    console.error("[dashboard] unsubscribes failed:", err);
    return null;
  }
}

/** Addresses that are unsubscribed in Resend for a known reason other than "not confirmed yet". */
async function notPendingEmails(since: Date | null) {
  try {
    const rows = await db()`SELECT email FROM newsletter_contacts
      WHERE unsubscribed_at IS NOT NULL OR (NOT confirmed AND created_at < ${since})`;
    return new Set((rows as Row[]).map((r) => String(r.email)));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="dash-card">
      <p className="label" style={{ marginBottom: 10 }}>{label}</p>
      <p className="dash-big">{value}</p>
      {sub && <p className="note" style={{ marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function Bars({
  data, labelKey, valueKey, showValues = false,
}: {
  data: Row[]; labelKey: string; valueKey: string; showValues?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey])));
  return (
    <div className="dash-bars">
      {data.map((d, i) => (
        <div key={i} className="dash-bar-col" title={`${d[labelKey]}: ${d[valueKey]}`}>
          {showValues && (
            <span className="dash-bar-value">
              {Number(d[valueKey]) > 0 ? String(d[valueKey]) : ""}
            </span>
          )}
          {/* cap at 78% so the value label above always has room */}
          <div className="dash-bar" style={{ height: `${Math.max(2, (Number(d[valueKey]) / max) * 78)}%` }} />
          <span className="dash-bar-label">
            {String(d[labelKey]).split(" ").map((part, j) => (
              <span key={j} className={j > 0 ? "dash-bar-tail" : undefined}>{j > 0 ? " " : ""}{part}</span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function Table({ rows, cols }: { rows: Row[]; cols: { key: string; label: string; right?: boolean }[] }) {
  return (
    <table className="dash-table">
      <thead>
        <tr>{cols.map((c) => <th key={c.key} style={c.right ? { textAlign: "right" } : undefined}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={cols.length} className="note">Ingen data endnu</td></tr>
        )}
        {rows.map((r, i) => (
          <tr key={i}>
            {cols.map((c) => (
              <td key={c.key} style={c.right ? { textAlign: "right" } : undefined}>
                {r[c.key] == null ? "-" : String(r[c.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const secret = process.env.CRON_SECRET;

  if (!secret || key !== secret) {
    return (
      <div className="band light">
        <div className="wrap">
          <p className="label">Dashboard</p>
          <h1 className="display-l" style={{ margin: "20px 0" }}>Adgang kræver nøgle</h1>
          <p className="lede">Tilføj ?key=... til adressen.</p>
        </div>
      </div>
    );
  }

  if (!dbConfigured()) {
    return (
      <div className="band light"><div className="wrap">
        <h1 className="display-l">DATABASE_URL mangler</h1>
      </div></div>
    );
  }

  const [a, nl, un, sc] = await Promise.all([
    analytics(), newsletter(), unsubscribes(), sourceClicks(),
  ]);
  // Resend marks both never-confirmed signups and real unsubscribes as
  // "unsubscribed"; only the first are pending.
  const known = un ? await notPendingEmails(un.since) : null;
  const pending = nl
    ? nl.flagged.filter((c) => !known?.has(c.email.trim().toLowerCase())).length
    : 0;
  const k = a.kpis;
  const fmtSecs = (s: unknown) =>
    s == null ? "-" : `${Math.floor(Number(s) / 60)}m ${Number(s) % 60}s`;

  return (
    <>
      <div className="band light" style={{ paddingBlock: "clamp(40px,5vw,64px)" }}>
        <div className="wrap">
          <p className="label live">Dashboard - opdateret nu</p>
          <h1 className="display-l" style={{ margin: "18px 0 0" }}>
            Sitet lige nu
          </h1>
        </div>
      </div>

      {/* NYHEDSBREV / LEADS (dark) */}
      <div className="band dark" style={{ paddingBlock: "clamp(40px,5vw,64px)" }}>
        <div className="wrap">
          <p className="label" style={{ marginBottom: 24 }}>Nyhedsbrev og leads</p>
          {!nl ? (
            <p className="lede">Kunne ikke hente Resend-data.</p>
          ) : (
            <>
              <div className="dash-grid">
                <Kpi label="Aktive abonnenter" value={String(nl.total)} />
                <Kpi label="Nye - 24 timer" value={String(nl.last24h)} />
                <Kpi label="Nye - 14 dage" value={String(nl.last14)} />
                <Kpi
                  label="Ubekræftede"
                  value={String(pending)}
                  sub={known ? "tilmeldt, ikke bekræftet" : "inkl. afmeldte - historik utilgængelig"}
                />
                {(() => {
                  // Resend Pro: 50,000 emails/month. Daily broadcast ~= active
                  // subscribers, so estimated monthly volume = active * 31.
                  const est = nl.total * 31;
                  const cap = 50000;
                  const warn = est >= cap * 0.9;
                  return (
                    <div className="dash-card" style={warn ? { borderColor: "#c2543c" } : undefined}>
                      <p className="label" style={{ marginBottom: 10 }}>Plan-forbrug (Pro)</p>
                      <p className="dash-big" style={warn ? { color: "#c2543c" } : undefined}>
                        {Math.round((est / cap) * 100)}%
                      </p>
                      <p className="note" style={{ marginTop: 4 }}>
                        {warn
                          ? `~${est.toLocaleString("da-DK")} af 50.000 mails/md - opgradering nødvendig snart`
                          : `~${est.toLocaleString("da-DK")} af 50.000 mails/md - plads til ~1.600 abonnenter`}
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div className="dash-two">
                <div className="dash-card">
                  <p className="label" style={{ marginBottom: 12 }}>Seneste tilmeldinger</p>
                  <Table
                    rows={nl.newest.map((c) => ({
                      email: c.email,
                      dato: new Date(c.created_at).toLocaleDateString("da-DK", { day: "2-digit", month: "short" }),
                    }))}
                    cols={[
                      { key: "email", label: "Email" },
                      { key: "dato", label: "Dato", right: true },
                    ]}
                  />
                  <p style={{ marginTop: 16 }}>
                    <a className="arrow" href={`/api/subscribers?key=${key}`}>
                      Hent hele listen (CSV) <span className="ar">&rarr;</span>
                    </a>
                  </p>
                </div>
                <div className="dash-card">
                  <p className="label" style={{ marginBottom: 12 }}>Daglige udsendelser</p>
                  <Table
                    rows={(nl.broadcasts as Row[]).map((b) => ({
                      navn: b.name,
                      status: b.status,
                    }))}
                    cols={[
                      { key: "navn", label: "Udsendelse" },
                      { key: "status", label: "Status", right: true },
                    ]}
                  />
                  <p className="note" style={{ marginTop: 12 }}>
                    Åbnings- og klikrater: se Resend-dashboardet (ikke i deres API endnu).
                  </p>
                </div>
              </div>

              {/* KILDEKLIK */}
              <p className="label" style={{ margin: "clamp(36px,5vw,56px) 0 24px" }}>
                Kilder til historierne
              </p>
              {!sc ? (
                <p className="note">Kunne ikke hente kildeklik.</p>
              ) : (
                <>
                  <div className="dash-grid">
                    <Kpi
                      label="Fra nyhedsbrevet - i dag"
                      value={String(sc.kpis.nl_today ?? 0)}
                      sub={`${sc.kpis.nl_7d ?? 0} på 7 dage`}
                    />
                    <Kpi
                      label="Klikkede videre - i dag"
                      value={String(sc.kpis.clickers_today ?? 0)}
                      sub={`${sc.kpis.clicks_today ?? 0} klik på en kilde`}
                    />
                    <Kpi label="Kildeklik - 7 dage" value={String(sc.kpis.clicks_7d ?? 0)} />
                  </div>
                  <div className="dash-two">
                    <div className="dash-card">
                      <p className="label" style={{ marginBottom: 12 }}>Pr. dag (14 dage)</p>
                      <Table
                        rows={sc.days}
                        cols={[
                          { key: "day", label: "Dag" },
                          { key: "nl", label: "Fra nyhedsbrev", right: true },
                          { key: "clickers", label: "Klikkede videre", right: true },
                          { key: "clicks", label: "Klik", right: true },
                        ]}
                      />
                      <p className="note" style={{ marginTop: 12 }}>
                        &ldquo;Fra nyhedsbrev&rdquo; er besøgende, der kom via linket i mailen.
                        &ldquo;Klikkede videre&rdquo; er besøgende, der klikkede på mindst én
                        kilde, uanset hvor de kom fra. Målt fra 5. oktober 2026.
                      </p>
                    </div>
                    <div className="dash-card">
                      <p className="label" style={{ marginBottom: 12 }}>Mest klikkede medier (30d)</p>
                      <Table
                        rows={sc.hosts}
                        cols={[
                          { key: "host", label: "Medie" },
                          { key: "clicks", label: "Klik", right: true },
                        ]}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* AFMELDINGER */}
              <p className="label" style={{ margin: "clamp(36px,5vw,56px) 0 24px" }}>Afmeldinger</p>
              {!un ? (
                <p className="note">Kunne ikke hente afmeldinger.</p>
              ) : (
                <>
                  <div className="dash-grid">
                    <Kpi label="Afmeldinger - 7 dage" value={String(un.d7)} />
                    <Kpi
                      label="Afmeldinger - 30 dage"
                      value={String(un.d30)}
                      sub={nl.total ? `${((un.d30 / (nl.total + un.d30)) * 100).toFixed(1)}% af abonnenterne` : undefined}
                    />
                    <Kpi
                      label="Median tid som abonnent"
                      value={un.medianDays == null ? "-" : `${un.medianDays} dage`}
                      sub={`blandt ${un.total} afmeldte`}
                    />
                    <Kpi
                      label="Gik inden 1 uge"
                      value={un.total ? `${Math.round((un.buckets[0].n / un.total) * 100)}%` : "-"}
                      sub={`${un.buckets[0].n} af ${un.total}`}
                    />
                  </div>
                  <div className="dash-two">
                    <div className="dash-card">
                      <p className="label" style={{ marginBottom: 16 }}>Tid som abonnent før afmelding</p>
                      <Bars data={un.buckets} labelKey="label" valueKey="n" showValues />
                    </div>
                    <div className="dash-card">
                      <p className="label" style={{ marginBottom: 16 }}>Afmeldinger pr. uge</p>
                      <Bars data={un.weeks} labelKey="week" valueKey="n" showValues />
                    </div>
                  </div>
                  <div className="dash-card" style={{ marginTop: 20 }}>
                    <p className="label" style={{ marginBottom: 12 }}>Seneste afmeldinger</p>
                    <Table
                      rows={un.recent.map((r) => ({
                        email: r.email,
                        tilmeldt: r.tilmeldt,
                        afmeldt: r.unsub_approx ? `ca. ${r.afmeldt}` : r.afmeldt,
                        tid: `${r.dage} dage`,
                      }))}
                      cols={[
                        { key: "email", label: "Email" },
                        { key: "tilmeldt", label: "Tilmeldt", right: true },
                        { key: "afmeldt", label: "Afmeldt", right: true },
                        { key: "tid", label: "Som abonnent", right: true },
                      ]}
                    />
                    <p className="note" style={{ marginTop: 12 }}>
                      Målt siden {un.sinceLabel}. Resend gemmer ikke, hvornår folk afmelder sig: datoer
                      markeret &ldquo;ca.&rdquo; er dagen for den sidste udgave, de modtog; nye afmeldinger
                      registreres præcist. {un.unknown} kontakter fra før {un.sinceLabel} kan ikke
                      placeres - de er enten afmeldt før da eller har aldrig bekræftet.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      {/* TRAFIK (light) */}
      <div className="band light" style={{ paddingBlock: "clamp(40px,5vw,64px)" }}>
        <div className="wrap">
          <p className="label" style={{ marginBottom: 24 }}>Trafik</p>
          <div className="dash-grid">
            <Kpi label="I dag" value={String(k.visitors_today ?? 0)} sub={`${k.views_today ?? 0} sidevisninger`} />
            <Kpi label="7 dage" value={String(k.visitors_7d ?? 0)} sub={`${k.views_7d ?? 0} sidevisninger`} />
            <Kpi label="30 dage" value={String(k.visitors_30d ?? 0)} sub={`${k.views_30d ?? 0} sidevisninger`} />
            <Kpi label="I alt" value={String(k.visitors_total ?? 0)} sub={`${k.views_total ?? 0} sidevisninger`} />
            <Kpi label="Tid pr. besøg (7d)" value={fmtSecs(k.avg_visit_secs)} sub="gennemsnit pr. besøgende" />
          </div>

          <div className="dash-two">
            <div className="dash-card">
              <p className="label" style={{ marginBottom: 16 }}>Besøgende - 14 dage</p>
              <Bars data={a.days as Row[]} labelKey="day" valueKey="visitors" showValues />
            </div>
            <div className="dash-card">
              <p className="label" style={{ marginBottom: 16 }}>Døgnrytme - visninger pr. time (7d)</p>
              <Bars
                data={Array.from({ length: 24 }, (_, h) => ({
                  hour: h,
                  views: Number((a.hours as Row[]).find((r) => Number(r.hour) === h)?.views ?? 0),
                }))}
                labelKey="hour"
                valueKey="views"
                showValues
              />
            </div>
          </div>

          <div className="dash-two">
            <div className="dash-card">
              <p className="label" style={{ marginBottom: 12 }}>Mest sete sider (30d)</p>
              <Table rows={(a.pages as Row[]).map((p) => ({
                ...p,
                tid: p.avg_secs == null ? "-" : fmtSecs(p.avg_secs),
              }))} cols={[
                { key: "path", label: "Side" },
                { key: "visitors", label: "Besøgende", right: true },
                { key: "views", label: "Visninger", right: true },
                { key: "tid", label: "Tid", right: true },
              ]} />
            </div>
            <div>
              <div className="dash-card" style={{ marginBottom: 20 }}>
                <p className="label" style={{ marginBottom: 12 }}>Kilder (30d)</p>
                <Table rows={a.refs as Row[]} cols={[
                  { key: "referrer", label: "Kilde" },
                  { key: "views", label: "Visninger", right: true },
                ]} />
              </div>
              <div className="dash-card">
                <p className="label" style={{ marginBottom: 12 }}>Lande (30d)</p>
                <Table rows={a.countries as Row[]} cols={[
                  { key: "country", label: "Land" },
                  { key: "visitors", label: "Besøgende", right: true },
                ]} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

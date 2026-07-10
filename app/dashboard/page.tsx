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
  const [kpis, days, hours, pages, refs, countries, devices] =
    await Promise.all([
      sql`SELECT
        count(*) FILTER (WHERE kind='view' AND (ts AT TIME ZONE 'Europe/Copenhagen')::date = (now() AT TIME ZONE 'Europe/Copenhagen')::date) AS views_today,
        count(DISTINCT visitor) FILTER (WHERE kind='view' AND (ts AT TIME ZONE 'Europe/Copenhagen')::date = (now() AT TIME ZONE 'Europe/Copenhagen')::date) AS visitors_today,
        count(*) FILTER (WHERE kind='view' AND ts >= now() - interval '7 days') AS views_7d,
        count(DISTINCT visitor) FILTER (WHERE kind='view' AND ts >= now() - interval '7 days') AS visitors_7d,
        count(*) FILTER (WHERE kind='view' AND ts >= now() - interval '30 days') AS views_30d,
        count(DISTINCT visitor) FILTER (WHERE kind='view' AND ts >= now() - interval '30 days') AS visitors_30d,
        round(avg(secs) FILTER (WHERE kind='leave' AND secs > 0 AND ts >= now() - interval '7 days')) AS avg_secs
      FROM hits`,
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
      FROM hits WHERE ts >= now() - interval '30 days'
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
  return { kpis: kpis[0] as Row, days, hours, pages, refs, countries, devices };
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
    const last14 = active.filter(
      (c) => Date.now() - new Date(c.created_at).getTime() < 14 * 86400e3
    );
    const newest = [...active]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 8);
    return { total: active.length, pending: contacts.length - active.length, last14: last14.length, newest, broadcasts };
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

function Bars({ data, labelKey, valueKey }: { data: Row[]; labelKey: string; valueKey: string }) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey])));
  return (
    <div className="dash-bars">
      {data.map((d, i) => (
        <div key={i} className="dash-bar-col" title={`${d[labelKey]}: ${d[valueKey]}`}>
          <div className="dash-bar" style={{ height: `${Math.max(3, (Number(d[valueKey]) / max) * 100)}%` }} />
          <span className="dash-bar-label">{String(d[labelKey])}</span>
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
          <h1 className="display-l" style={{ margin: "20px 0" }}>Adgang kraever noegle</h1>
          <p className="lede">Tilfoej ?key=... til adressen.</p>
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

  const [a, nl] = await Promise.all([analytics(), newsletter()]);
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

      {/* TRAFIK (dark) */}
      <div className="band dark" style={{ paddingBlock: "clamp(40px,5vw,64px)" }}>
        <div className="wrap">
          <p className="label" style={{ marginBottom: 24 }}>Trafik</p>
          <div className="dash-grid">
            <Kpi label="I dag" value={String(k.visitors_today ?? 0)} sub={`${k.views_today ?? 0} sidevisninger`} />
            <Kpi label="7 dage" value={String(k.visitors_7d ?? 0)} sub={`${k.views_7d ?? 0} sidevisninger`} />
            <Kpi label="30 dage" value={String(k.visitors_30d ?? 0)} sub={`${k.views_30d ?? 0} sidevisninger`} />
            <Kpi label="Tid pr. side (7d)" value={fmtSecs(k.avg_secs)} sub="gennemsnit" />
          </div>

          <div className="dash-two">
            <div className="dash-card">
              <p className="label" style={{ marginBottom: 16 }}>Besoegende - 14 dage</p>
              <Bars data={a.days as Row[]} labelKey="day" valueKey="visitors" />
            </div>
            <div className="dash-card">
              <p className="label" style={{ marginBottom: 16 }}>Doegnrytme - visninger pr. time (7d)</p>
              <Bars
                data={Array.from({ length: 24 }, (_, h) => ({
                  hour: h,
                  views: Number((a.hours as Row[]).find((r) => Number(r.hour) === h)?.views ?? 0),
                }))}
                labelKey="hour"
                valueKey="views"
              />
            </div>
          </div>

          <div className="dash-two">
            <div className="dash-card">
              <p className="label" style={{ marginBottom: 12 }}>Mest sete sider (30d)</p>
              <Table rows={a.pages as Row[]} cols={[
                { key: "path", label: "Side" },
                { key: "visitors", label: "Besoegende", right: true },
                { key: "views", label: "Visninger", right: true },
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
                  { key: "visitors", label: "Besoegende", right: true },
                ]} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NYHEDSBREV / LEADS (light) */}
      <div className="band light" style={{ paddingBlock: "clamp(40px,5vw,64px)" }}>
        <div className="wrap">
          <p className="label" style={{ marginBottom: 24 }}>Nyhedsbrev og leads</p>
          {!nl ? (
            <p className="lede">Kunne ikke hente Resend-data.</p>
          ) : (
            <>
              <div className="dash-grid">
                <Kpi label="Aktive abonnenter" value={String(nl.total)} />
                <Kpi label="Nye - 14 dage" value={String(nl.last14)} />
                <Kpi label="Ubekraeftede" value={String(nl.pending)} sub="tilmeldt, ikke bekraeftet" />
                <Kpi label="Udsendelser" value={String(nl.broadcasts.length)} sub="seneste 7 vist herunder" />
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
                    Aabnings- og klikrater: se Resend-dashboardet (ikke i deres API endnu).
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

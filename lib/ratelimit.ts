import { neon } from "@neondatabase/serverless";

/**
 * Simple Neon-backed sliding-window rate limiter, shared across serverless
 * instances. Fails OPEN (never blocks legit users because the database
 * hiccuped) - the goal is stopping floods, not perfection.
 */
export async function rateLimited(
  bucket: string,
  ip: string,
  limit: number,
  windowSecs: number
): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  const key = `${bucket}:${ip}`;
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`INSERT INTO rate_events (key) VALUES (${key})`;
    const rows = await sql`SELECT count(*) AS c FROM rate_events
      WHERE key = ${key} AND ts > now() - make_interval(secs => ${windowSecs})`;
    if (Math.random() < 0.02) {
      await sql`DELETE FROM rate_events WHERE ts < now() - interval '2 days'`;
    }
    return Number(rows[0].c) > limit;
  } catch (err) {
    console.error("[ratelimit] failed open:", err);
    return false;
  }
}

export function clientIp(req: Request): string {
  const h = (n: string) => (req.headers.get(n) ?? "").split(",")[0].trim();
  return h("x-real-ip") || h("x-forwarded-for") || "unknown";
}

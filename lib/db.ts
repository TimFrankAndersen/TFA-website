import { neon } from "@neondatabase/serverless";

/** Neon Postgres client for the analytics hits table. */
export function db() {
  return neon(process.env.DATABASE_URL ?? "");
}

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

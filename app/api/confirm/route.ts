import { NextRequest, NextResponse } from "next/server";
import { isConfigured, tokenValid, activateContact } from "@/lib/newsletter";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("e") ?? "").trim().toLowerCase();
  const token = url.searchParams.get("t") ?? "";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (!isConfigured() || !email || !tokenValid(email, token)) {
    return NextResponse.redirect(`${base}/welcome?ok=0`);
  }

  const res = await activateContact(email);
  if (!res.ok) {
    console.error("[newsletter] activate failed:", res.status);
    return NextResponse.redirect(`${base}/welcome?ok=0`);
  }
  return NextResponse.redirect(`${base}/welcome`);
}

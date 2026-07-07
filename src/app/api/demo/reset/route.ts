import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/demo";
import { reseedDemo } from "@/lib/demo-seed";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Authorized via the `Authorization: Bearer <token>` header only (never a URL
 * query param, so the secret can't leak into logs/history/referrers). Accepts
 * either CRON_SECRET (Vercel Cron sends this automatically) or DEMO_RESET_SECRET
 * (for manual `curl -H "Authorization: Bearer ..."` triggers).
 */
function authorized(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length);
  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return true;
  if (process.env.DEMO_RESET_SECRET && token === process.env.DEMO_RESET_SECRET) return true;
  return false;
}

async function handle(req: Request) {
  if (!isDemoMode()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await reseedDemo(prisma);
  return NextResponse.json({ ok: true, reseededAt: new Date().toISOString() });
}

// Vercel Cron triggers GET; POST is supported for manual triggering.
export const GET = handle;
export const POST = handle;

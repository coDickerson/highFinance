import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/demo";
import { reseedDemo } from "@/lib/demo-seed";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Authorized if it's a Vercel Cron call (Bearer CRON_SECRET) or a manual call with ?secret=DEMO_RESET_SECRET. */
function authorized(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  const s = new URL(req.url).searchParams.get("secret");
  if (process.env.DEMO_RESET_SECRET && s === process.env.DEMO_RESET_SECRET) return true;
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

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { generateUpcomingInvoices } from "@/modules/billing/auto-invoice";

export const dynamic = "force-dynamic";

/** Dipanggil timer harian di server (portfolio-invoices.timer) dengan `Authorization: Bearer $CRON_SECRET`. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "CRON_SECRET belum diset" }, { status: 503 });
  const got = Buffer.from((req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(secret);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return NextResponse.json({ ok: false }, { status: 401 });
  const created = await generateUpcomingInvoices();
  return NextResponse.json({ ok: true, created });
}

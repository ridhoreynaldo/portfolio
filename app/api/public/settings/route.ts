import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    const rows = await db.select().from(siteSettings);
    return NextResponse.json({
      settings: Object.fromEntries(rows.map((r) => [r.key, r.value])),
    });
  } catch (e) {
    return apiError(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requirePermission } from "@/lib/rbac";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    await requirePermission("settings.manage");
    const rows = await db.select().from(siteSettings);
    return NextResponse.json({
      settings: Object.fromEntries(rows.map((r) => [r.key, r.value])),
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requirePermission("settings.manage");
    const { settings } = await req.json();
    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Payload settings tidak valid" },
        { status: 400 }
      );
    }
    const entries = Object.entries(settings as Record<string, string>).filter(
      ([k]) => k.trim() !== ""
    );
    for (const [key, value] of entries) {
      await db
        .insert(siteSettings)
        .values({ key: key.trim(), value: String(value ?? ""), updatedAt: new Date() })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: String(value ?? ""), updatedAt: new Date() },
        });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

// Hapus key: DELETE /api/admin/settings?key=xxx
export async function DELETE(req: NextRequest) {
  try {
    await requirePermission("settings.manage");
    const key = new URL(req.url).searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Parameter key wajib" }, { status: 400 });
    }
    await db.delete(siteSettings).where(sql`${siteSettings.key} = ${key}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { experiences } from "@/db/schema";
import { requirePermission } from "@/lib/rbac";
import { apiError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const PERM = "experiences.manage";

const VALID_ICONS = new Set([
  "briefcase",
  "code",
  "server",
  "database",
  "cloud",
  "smartphone",
  "globe",
  "wrench",
  "rocket",
  "users",
]);

function parseIcon(input: unknown): string | null {
  const v = String(input ?? "").trim().toLowerCase();
  return VALID_ICONS.has(v) ? v : null;
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await requirePermission(PERM);
    const { id } = await params;
    const body = await req.json();
    const {
      company,
      position,
      location,
      startDate,
      endDate,
      isCurrent,
      description,
      icon,
      sortOrder,
    } = body;
    if (!company || !position || !description) {
      return NextResponse.json(
        { error: "Perusahaan, posisi, dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }
    const [experience] = await db
      .update(experiences)
      .set({
        company: String(company),
        position: String(position),
        location: location || null,
        startDate: String(startDate || ""),
        endDate: endDate || null,
        isCurrent: isCurrent === true,
        description: String(description),
        icon: parseIcon(icon),
        sortOrder: Number(sortOrder ?? 0),
        updatedAt: new Date(),
      })
      .where(eq(experiences.id, id))
      .returning();
    if (!experience) {
      return NextResponse.json(
        { error: "Pengalaman tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ experience });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requirePermission(PERM);
    const { id } = await params;
    await db.delete(experiences).where(eq(experiences.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

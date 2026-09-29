import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { experiences } from "@/db/schema";
import { requirePermission } from "@/lib/rbac";
import { apiError } from "@/lib/api";

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

export async function GET() {
  try {
    await requirePermission(PERM);
    const rows = await db
      .select()
      .from(experiences)
      .orderBy(asc(experiences.sortOrder));
    return NextResponse.json({ experiences: rows });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission(PERM);
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
      .insert(experiences)
      .values({
        company: String(company),
        position: String(position),
        location: location || null,
        startDate: String(startDate || ""),
        endDate: endDate || null,
        isCurrent: isCurrent === true,
        description: String(description),
        icon: parseIcon(icon),
        sortOrder: Number(sortOrder ?? 0),
      })
      .returning();
    return NextResponse.json({ experience }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

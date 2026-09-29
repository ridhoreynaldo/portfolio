import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requirePermission } from "@/lib/rbac";
import { apiError } from "@/lib/api";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 200) || "proyek";
}

function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === "string")
    return input.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

export async function GET() {
  try {
    await requirePermission("projects.manage");
    const rows = await db.select().from(projects).orderBy(asc(projects.sortOrder));
    return NextResponse.json({ projects: rows });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("projects.manage");
    const body = await req.json();
    const { title, slug, description, imageUrl, tags, demoUrl, repoUrl, isFeatured, isPublished, sortOrder } = body;
    if (!title || !description) {
      return NextResponse.json(
        { error: "Judul dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }
    const [project] = await db
      .insert(projects)
      .values({
        title: String(title),
        slug: slug ? String(slug) : slugify(String(title)),
        description: String(description),
        imageUrl: imageUrl || null,
        tags: parseTags(tags),
        demoUrl: demoUrl || null,
        repoUrl: repoUrl || null,
        isFeatured: isFeatured === true,
        isPublished: isPublished !== false,
        sortOrder: Number(sortOrder ?? 0),
      })
      .returning();
    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code: string }).code === "23505") {
      return NextResponse.json({ error: "Slug sudah dipakai" }, { status: 409 });
    }
    return apiError(e);
  }
}

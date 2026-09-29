import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requirePermission } from "@/lib/rbac";
import { apiError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === "string")
    return input.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await requirePermission("projects.manage");
    const { id } = await params;
    const body = await req.json();
    const { title, slug, description, imageUrl, tags, demoUrl, repoUrl, isFeatured, isPublished, sortOrder } = body;
    if (!title || !description) {
      return NextResponse.json(
        { error: "Judul dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }
    const [project] = await db
      .update(projects)
      .set({
        title: String(title),
        slug: String(slug || title).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: String(description),
        imageUrl: imageUrl || null,
        tags: parseTags(tags),
        demoUrl: demoUrl || null,
        repoUrl: repoUrl || null,
        isFeatured: isFeatured === true,
        isPublished: isPublished !== false,
        sortOrder: Number(sortOrder ?? 0),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    if (!project) {
      return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code: string }).code === "23505") {
      return NextResponse.json({ error: "Slug sudah dipakai" }, { status: 409 });
    }
    return apiError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requirePermission("projects.manage");
    const { id } = await params;
    await db.delete(projects).where(eq(projects.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

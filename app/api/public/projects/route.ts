import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(asc(projects.sortOrder));
    return NextResponse.json({ projects: rows });
  } catch (e) {
    return apiError(e);
  }
}

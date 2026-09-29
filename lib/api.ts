import { NextResponse } from "next/server";

/** Ubah Error guard RBAC menjadi response HTTP yang sesuai. */
export function apiError(e: unknown): NextResponse {
  if (e instanceof Error && e.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  if (e instanceof Error && e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }
  console.error(e);
  return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
}

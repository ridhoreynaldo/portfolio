import { NextResponse } from "next/server";
import { z } from "zod";
import { can, getCurrentUser } from "@/modules/auth/session";
import { getFile } from "@/modules/billing/repository";

export const dynamic = "force-dynamic";

/** File dari DB: QRIS (publik) atau bukti bayar (pemilik / admin tagihan). */
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse("Not found", { status: 404 });
  const f = await getFile(id);
  if (!f) return new NextResponse("Not found", { status: 404 });
  if (!f.isPublic) {
    const user = await getCurrentUser();
    const allowed = !!user && (user.id === f.ownerId || can(user, "invoice.read") || can(user, "payment.read"));
    if (!allowed) return new NextResponse("Forbidden", { status: 403 });
  }
  const body = new Uint8Array(f.data);
  return new NextResponse(body, {
    headers: {
      "Content-Type": f.mime,
      "Content-Length": String(f.size),
      "Content-Disposition": `inline; filename="${encodeURIComponent(f.name)}"`,
      "Cache-Control": f.isPublic ? "public, max-age=3600" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

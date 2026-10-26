import "server-only";
import { redirect } from "next/navigation";
import { forbidden } from "@/shared/errors";
import { can, getCurrentUser, isStaff, type AuthUser } from "./session";

/** Halaman: wajib login. `next` = path tujuan setelah login (hanya path relatif). */
export async function requireUser(next?: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

/** Halaman panel admin: wajib login DAN staf (super admin / punya permission). Pelanggan diarahkan ke portal. */
export async function requireStaff(): Promise<AuthUser> {
  const user = await requireUser();
  if (!isStaff(user)) redirect("/portal");
  return user;
}

/** Server action pelanggan: wajib login (staf juga boleh, untuk uji coba). */
export async function requireLogin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw forbidden("Silakan login dulu");
  return user;
}

/** Halaman: wajib permission → kalau tidak, ke dashboard dengan pesan. (Dashboard sendiri hanya butuh login → tidak ada loop.) */
export async function requirePermissionPage(key: string): Promise<AuthUser> {
  const user = await requireUser();
  if (!can(user, key)) redirect("/admin?denied=" + encodeURIComponent(key));
  return user;
}

/** Server action: wajib permission → lempar error (ditangkap wrapper `action()`). */
export async function requirePermission(key: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user, key)) throw forbidden(`Butuh permission ${key}`);
  return user;
}

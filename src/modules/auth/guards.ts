import "server-only";
import { redirect } from "next/navigation";
import { forbidden } from "@/shared/errors";
import { can, getCurrentUser, type AuthUser } from "./session";

/** Halaman: wajib login. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
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

import "server-only";
import { headers } from "next/headers";

/**
 * Satu aplikasi melayani dua situs:
 *  - "portfolio" → ridhoreynaldo.com  (konten portofolio)
 *  - "leet"      → leetcloud.my.id    (jasa: paket, layanan, tagihan, pelanggan)
 * Panel /admin dipisah per situs: menu & dashboard mengikuti domain yang dibuka.
 */
export type Site = "portfolio" | "leet";

export const SITE_URL: Record<Site, string> = { portfolio: "https://ridhoreynaldo.com", leet: "https://leetcloud.my.id" };

/** Halaman admin milik Leetcloud; sisanya milik portofolio. /admin & /admin/account ada di keduanya. */
export const LEET_ADMIN = ["/admin/packages", "/admin/orders", "/admin/invoices", "/admin/customers", "/admin/payment"];
export const SHARED_ADMIN = ["/admin", "/admin/account"];

export async function currentSite(): Promise<Site> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();
  return host.includes("leetcloud") ? "leet" : "portfolio";
}

/** Path admin ini milik situs mana (null = tersedia di keduanya). */
export function adminSiteOf(path: string): Site | null {
  if (SHARED_ADMIN.includes(path)) return null;
  return LEET_ADMIN.some((p) => path === p || path.startsWith(`${p}/`)) ? "leet" : "portfolio";
}

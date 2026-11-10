import { redirect } from "next/navigation";

/** Daftar tagihan digabung ke Ringkasan (/dashboard). Halaman bayar per tagihan (/dashboard/tagihan/[id]) tetap ada. */
export default function PortalInvoices() {
  redirect("/dashboard");
}

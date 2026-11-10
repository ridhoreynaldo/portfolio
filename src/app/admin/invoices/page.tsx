import { redirect } from "next/navigation";

/** Halaman Tagihan digabung ke Pelanggan (/admin/customers). ?status=open|verify → filter tagihan belum lunas. */
export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  redirect(status === "open" || status === "verify" ? "/admin/customers?f=open" : "/admin/customers");
}

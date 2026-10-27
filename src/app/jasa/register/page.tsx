import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/modules/auth/session";
import { getPortfolio } from "@/modules/portfolio/service";
import { ServiceBrandMark, serviceBrandOf } from "@/components/service-shell";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daftar Pelanggan" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  const [{ next }, { profile }] = await Promise.all([searchParams, getPortfolio()]);
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  return (
    <div className="svc grid min-h-screen place-items-center px-4 py-10">
      <main className="card w-full max-w-md p-8">
        <ServiceBrandMark brand={serviceBrandOf(profile)} title="Daftar Pelanggan" sub="Gratis. Untuk memesan jasa, melihat tagihan, dan membayar via QRIS." />
        <RegisterForm next={safe} />
        <p className="mt-5 text-center text-sm text-[var(--ink-3)]">
          Sudah punya akun? <Link href={safe ? `/jasa/login?next=${encodeURIComponent(safe)}` : "/jasa/login"} className="font-semibold text-[var(--navy)] hover:underline">Login</Link>
        </p>
        <p className="mt-6 text-center text-xs text-[var(--ink-3)]"><Link href="/jasa" className="hover:text-[var(--navy)]">← Halaman jasa</Link></p>
      </main>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { readFlash } from "@/shared/action";
import { Flash } from "@/shared/ui";
import { getCurrentUser, homeFor } from "@/modules/auth/session";
import { getPortfolio } from "@/modules/portfolio/service";
import { ServiceBrandMark, serviceBrandOf } from "@/components/service-shell";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  const [{ next }, flash, { profile }] = await Promise.all([searchParams, readFlash(), getPortfolio()]);
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  return (
    <div className="svc grid min-h-screen place-items-center px-4 py-10">
      <main className="card w-full max-w-sm p-8">
        <ServiceBrandMark brand={serviceBrandOf(profile)} title="Masuk" sub="Pelanggan: portal pesanan & tagihan. Admin: panel pengelolaan." />
        <Flash flash={flash} />
        <LoginForm next={safe} />
        <p className="mt-5 text-center text-sm text-[var(--ink-3)]">
          Belum punya akun? <Link href={safe ? `/register?next=${encodeURIComponent(safe)}` : "/register"} className="font-semibold text-[var(--navy)] hover:underline">Daftar gratis</Link>
        </p>
        <p className="mt-6 flex justify-center gap-5 text-xs text-[var(--ink-3)]">
          <Link href="/jasa" className="hover:text-[var(--navy)]">← Halaman jasa</Link>
        </p>
      </main>
    </div>
  );
}

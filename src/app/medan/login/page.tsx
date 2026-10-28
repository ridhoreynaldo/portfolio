import Link from "next/link";
import { redirect } from "next/navigation";
import { readFlash } from "@/shared/action";
import { Flash } from "@/shared/ui";
import { getCurrentUser, homeFor } from "@/modules/auth/session";
import { ServiceBrandMark, SERVICE_BRAND } from "@/components/service-shell";
import { LoginForm } from "@/app/login/login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Login" };

/** Login Leetcloud: pelanggan → dashboard pelanggan; staf → panel admin. Terpisah dari halaman masuk portofolio (/login). */
export default async function JasaLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  const [{ next }, flash] = await Promise.all([searchParams, readFlash()]);
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  return (
    <div className="svc grid min-h-screen place-items-center px-4 py-10">
      <main className="card w-full max-w-sm p-8">
        <ServiceBrandMark brand={SERVICE_BRAND} title="Login" sub="Masuk ke dashboard pelanggan: langganan, tagihan, dan pembayaran QRIS." />
        <Flash flash={flash} />
        <LoginForm next={safe} />
        <p className="mt-5 text-center text-sm text-[var(--ink-3)]">
          Belum punya akun? <Link href={safe ? `/medan/register?next=${encodeURIComponent(safe)}` : "/medan/register"} className="font-semibold text-[var(--navy)] hover:underline">Daftar gratis</Link>
        </p>
        <p className="mt-6 text-center text-xs text-[var(--ink-3)]"><Link href="/medan" className="hover:text-[var(--navy)]">← Halaman jasa</Link></p>
      </main>
    </div>
  );
}

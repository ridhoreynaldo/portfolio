import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/modules/auth/session";
import { Starfield } from "@/components/starfield";
import { SERVICE_BRAND_FALLBACK, ServiceBrandMark } from "@/components/site-header";
import { getPortfolio } from "@/modules/portfolio/service";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daftar Pelanggan" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  const [{ next }, { profile }] = await Promise.all([searchParams, getPortfolio()]);
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-10">
      <Starfield grid={false} />
      <div className="hud relative z-10 w-full max-w-md p-8">
        <ServiceBrandMark brand={profile?.serviceBrand || SERVICE_BRAND_FALLBACK} by={profile?.fullName || "Portfolio"} sub="new account · daftar pelanggan" />
        <p className="mb-5 -mt-2 text-xs text-slate-400">Gratis. Untuk memesan jasa/sewa, melihat tagihan, dan membayar via QRIS.</p>
        <RegisterForm next={safe} />
        <p className="mt-5 text-center text-xs text-slate-400">
          Sudah punya akun? <Link href={safe ? `/login?next=${encodeURIComponent(safe)}` : "/login"} className="text-cyan-300 hover:underline">Masuk</Link>
        </p>
      </div>
    </main>
  );
}

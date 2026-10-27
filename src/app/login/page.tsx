import Link from "next/link";
import { redirect } from "next/navigation";
import { readFlash } from "@/shared/action";
import { Flash } from "@/shared/ui";
import { getCurrentUser, homeFor } from "@/modules/auth/session";
import { Starfield } from "@/components/starfield";
import { SERVICE_BRAND_FALLBACK, ServiceBrandMark } from "@/components/site-header";
import { getPortfolio } from "@/modules/portfolio/service";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  const [{ next }, flash, { profile }] = await Promise.all([searchParams, readFlash(), getPortfolio()]);
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  return (
    <main className="relative grid min-h-screen place-items-center px-4">
      <Starfield grid={false} />
      <div className="hud relative z-10 w-full max-w-sm p-8">
        <ServiceBrandMark brand={profile?.serviceBrand || SERVICE_BRAND_FALLBACK} by={profile?.fullName || "Portfolio"} sub="access terminal · masuk" />
        <p className="mb-5 text-xs text-slate-400">Pelanggan: akses portal order & tagihan. Admin: panel pengelolaan.</p>
        <Flash flash={flash} />
        <LoginForm next={safe} />
        <p className="mt-5 text-center text-xs text-slate-400">
          Belum punya akun? <Link href={safe ? `/register?next=${encodeURIComponent(safe)}` : "/register"} className="text-cyan-300 hover:underline">Daftar pelanggan</Link>
        </p>
        <p className="mt-4 flex justify-center gap-4 text-xs text-slate-500"><Link href="/jasa" className="hover:text-cyan-300">← halaman jasa</Link><Link href="/" className="hover:text-cyan-300">portofolio</Link></p>
      </div>
    </main>
  );
}

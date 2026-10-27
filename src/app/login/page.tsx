import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Starfield } from "@/components/starfield";
import { readFlash } from "@/shared/action";
import { Flash } from "@/shared/ui";
import { getCurrentUser, homeFor } from "@/modules/auth/session";
import { getPortfolio } from "@/modules/portfolio/service";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk Admin" };

/** Masuk panel admin portofolio (tema galactic). Pelanggan Kodeva login di /jasa/login. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  const [{ next }, flash, { profile }] = await Promise.all([searchParams, readFlash(), getPortfolio()]);
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  return (
    <div className="relative min-h-screen">
      <Starfield />
      <div className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        <main className="hud w-full max-w-sm p-8">
          <div className="mb-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center border border-cyan-300/50 text-cyan-200" style={{ clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }}><KeyRound className="h-5 w-5" /></span>
            <p className="hud-label mt-4">// panel admin</p>
            <h1 className="font-display mt-1 text-2xl font-black tracking-wide text-white">{profile?.siteName || "Portofolio"}</h1>
            <p className="mt-1 text-sm text-slate-400">Masuk untuk mengelola konten portofolio.</p>
          </div>
          <Flash flash={flash} />
          <LoginForm next={safe} />
          <p className="mt-6 text-center text-xs text-slate-500"><Link href="/" className="hover:text-cyan-300">← Kembali ke portofolio</Link></p>
        </main>
      </div>
    </div>
  );
}

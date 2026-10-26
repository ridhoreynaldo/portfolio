import Link from "next/link";
import { redirect } from "next/navigation";
import { readFlash } from "@/shared/action";
import { Flash } from "@/shared/ui";
import { getCurrentUser, homeFor } from "@/modules/auth/session";
import { Starfield } from "@/components/starfield";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  const [{ next }, flash] = await Promise.all([searchParams, readFlash()]);
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  return (
    <main className="relative grid min-h-screen place-items-center px-4">
      <Starfield grid={false} />
      <div className="hud relative z-10 w-full max-w-sm p-8">
        <div className="mb-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-md shadow-[0_0_16px_rgba(0,240,255,0.5)]" />
          <div>
            <p className="hud-label">// access terminal</p>
            <h1 className="font-display text-lg font-bold text-white">Masuk</h1>
          </div>
        </div>
        <p className="mb-5 text-xs text-slate-400">Pelanggan: akses portal order & tagihan. Admin: panel pengelolaan.</p>
        <Flash flash={flash} />
        <LoginForm next={safe} />
        <p className="mt-5 text-center text-xs text-slate-400">
          Belum punya akun? <Link href={safe ? `/register?next=${encodeURIComponent(safe)}` : "/register"} className="text-cyan-300 hover:underline">Daftar pelanggan</Link>
        </p>
        <a href="/" className="mt-4 block text-center text-xs text-slate-500 hover:text-cyan-300">← kembali ke portofolio</a>
      </div>
    </main>
  );
}

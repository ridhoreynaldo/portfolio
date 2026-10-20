import { redirect } from "next/navigation";
import { readFlash } from "@/shared/action";
import { Flash } from "@/shared/ui";
import { getCurrentUser } from "@/modules/auth/session";
import { Starfield } from "@/components/starfield";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Login" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  const flash = await readFlash();
  return (
    <main className="relative grid min-h-screen place-items-center px-4">
      <Starfield />
      <div className="glass relative z-10 w-full max-w-sm rounded-2xl p-8">
        <div className="mb-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-xl" />
          <div>
            <h1 className="font-display text-xl font-bold text-white">Panel Admin</h1>
            <p className="text-xs text-slate-400">Masuk untuk mengelola portofolio</p>
          </div>
        </div>
        <Flash flash={flash} />
        <LoginForm />
        <a href="/" className="mt-6 block text-center text-xs text-slate-500 hover:text-cyan-300">← kembali ke portofolio</a>
      </div>
    </main>
  );
}

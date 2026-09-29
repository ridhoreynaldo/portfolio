"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Rocket } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login gagal");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="glass w-full max-w-md rounded-3xl p-8 shadow-[0_30px_80px_-20px_rgba(124,58,237,0.5)]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg">
            <Rocket className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold">
            Masuk ke <span className="text-gradient">Mission Control</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Kelola portfolio dan konten dari sini
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="input-dark"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Kata Sandi</label>
            <input
              id="password"
              type="password"
              required
              className="input-dark"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            <LogIn className="h-4 w-4" />
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

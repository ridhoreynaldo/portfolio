"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/modules/auth/actions";

export function RegisterForm({ next = "" }: { next?: string }) {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(registerAction, {});
  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label className="label" htmlFor="name">Nama lengkap *</label>
        <input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" className="input-dark" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email *</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input-dark" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="phone">WhatsApp</label>
          <input id="phone" name="phone" inputMode="tel" placeholder="08xxxxxxxxxx" autoComplete="tel" className="input-dark" />
        </div>
        <div>
          <label className="label" htmlFor="company">Instansi / usaha</label>
          <input id="company" name="company" maxLength={128} autoComplete="organization" className="input-dark" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">Password *</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input-dark" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Ulangi password *</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input-dark" />
        </div>
      </div>
      {state.error && <p className="border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Mendaftar…" : "Daftar & masuk"}</button>
    </form>
  );
}

import { cookies, headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { AppError } from "@/shared/errors";

const FLASH = "pf_flash";

/**
 * Bungkus server action: AppError/ZodError diubah jadi pesan "flash" (cookie 5 dtk) yang tampil
 * di layout admin, lalu user dikembalikan ke halaman asal. Error lain dilempar apa adanya
 * (Next menampilkan halaman error; di produksi pesannya disembunyikan).
 */
export function action<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  return async (...args: A): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (e) {
      unstable_rethrow(e);
      let msg: string;
      if (e instanceof AppError) msg = e.message;
      else if (e instanceof ZodError) msg = "Input tidak valid: " + e.issues.map((i) => i.message).join(", ");
      else throw e;
      await setFlash(msg, "error");
      const ref = (await headers()).get("referer");
      let back = "/admin";
      try {
        if (ref) {
          const u = new URL(ref);
          back = u.pathname + u.search;
        }
      } catch {
        /* ignore */
      }
      redirect(back);
    }
  };
}

export async function setFlash(message: string, type: "error" | "ok" = "ok") {
  (await cookies()).set(FLASH, JSON.stringify({ type, message: message.slice(0, 300) }), {
    httpOnly: true,
    maxAge: 5,
    path: "/",
    sameSite: "lax",
  });
}

export async function readFlash(): Promise<{ type: "error" | "ok"; message: string } | null> {
  const raw = (await cookies()).get(FLASH)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { type: "error" | "ok"; message: string };
  } catch {
    return null;
  }
}

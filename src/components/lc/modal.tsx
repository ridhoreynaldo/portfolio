"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Modal berbasis URL: dibuka lewat ?new=1 / ?edit=<id>, ditutup dengan kembali ke `close`.
 * HP: lembar dari bawah; desktop: dialog di tengah. Esc / klik latar / tombol × menutup.
 * Form di dalamnya tetap server action biasa (setelah simpan, aksi mengalihkan ke halaman daftar → modal tertutup).
 */
export function Modal({ title, close, children, wide }: { title: ReactNode; close: string; children: ReactNode; wide?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") router.push(close, { scroll: false }); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [close, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
      <Link href={close} scroll={false} aria-label="Tutup" className="absolute inset-0 bg-[rgba(3,6,18,0.62)] backdrop-blur-[2px]" />
      <div className={`modal-panel relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl ${wide ? "sm:max-w-4xl" : "sm:max-w-2xl"}`}>
        <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <h2 className="truncate text-base font-bold text-[var(--ink)]">{title}</h2>
          <Link href={close} scroll={false} className="btn-ghost btn-sm btn-icon shrink-0" aria-label="Tutup"><X className="h-4 w-4" /></Link>
        </header>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/** Notifikasi melayang (sukses/gagal), tampil di atas modal; hilang sendiri setelah beberapa detik. */
export function Toast({ flash }: { flash: { type: "error" | "ok"; message: string } | null }) {
  const [show, setShow] = useState(!!flash);
  useEffect(() => {
    setShow(!!flash);
    if (!flash) return;
    const t = setTimeout(() => setShow(false), flash.type === "error" ? 8000 : 4000);
    return () => clearTimeout(t);
  }, [flash]);
  if (!flash || !show) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div className={`pointer-events-auto flex max-w-md items-start gap-3 px-4 py-3 text-sm shadow-lg ${flash.type === "error" ? "alert-error" : "alert-ok"}`}>
        <span className="flex-1">{flash.message}</span>
        <button type="button" onClick={() => setShow(false)} aria-label="Tutup notifikasi" className="opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

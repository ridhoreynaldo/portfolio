"use client";

import { useEffect } from "react";

/**
 * Halaman utama: matikan klik kanan, salin/potong, seret, dan blok teks — diam-diam (tanpa pesan larangan).
 * Kolom isian tetap bisa dipakai normal. Hanya aktif selama komponen ini terpasang.
 */
export function NoCopy() {
  useEffect(() => {
    const editable = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("input, textarea, select, [contenteditable='true']");
    const block = (e: Event) => { if (!editable(e.target)) e.preventDefault(); };
    const evs = ["contextmenu", "copy", "cut", "dragstart", "selectstart"] as const;
    evs.forEach((ev) => document.addEventListener(ev, block));
    document.documentElement.classList.add("lc-nocopy");
    return () => {
      evs.forEach((ev) => document.removeEventListener(ev, block));
      document.documentElement.classList.remove("lc-nocopy");
    };
  }, []);
  return null;
}

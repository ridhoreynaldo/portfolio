"use client";
import { useEffect, useRef, useState } from "react";
import { X, ZoomIn } from "lucide-react";

/** Gambar yang bisa diklik: tampil besar (ukuran asli, setajam mungkin) di overlay layar penuh. Esc / klik di luar untuk menutup. */
export function ZoomImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="group relative mx-auto block cursor-zoom-in" aria-label={`Perbesar ${alt}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={className} />
        <span className="absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white"><ZoomIn className="h-3 w-3" /> Perbesar</span>
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={alt} onClick={() => setOpen(false)} className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/85 p-3 sm:p-8">
          <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="Tutup"><X className="h-5 w-5" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-lg bg-white object-contain p-3 shadow-2xl" style={{ minWidth: "min(90vw, 560px)" }} />
        </div>
      )}
    </>
  );
}

"use client";

import { Printer } from "lucide-react";

/** Tombol cetak invoice (membuka dialog cetak / simpan PDF browser). Disembunyikan saat dicetak. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary btn-sm print:hidden">
      <Printer className="h-3.5 w-3.5" /> Cetak / simpan PDF
    </button>
  );
}

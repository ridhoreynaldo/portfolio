"use client";

import { useState } from "react";

const fmt = (digits: string) => (digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "");

/** Isian rupiah: tampil dengan titik ribuan (300.000) saat mengetik; yang dikirim ke server hanya angka. */
export function MoneyInput({ name, defaultValue, placeholder, className = "input-dark" }: { name: string; defaultValue?: number | string | null; placeholder?: string; className?: string }) {
  const [raw, setRaw] = useState(String(defaultValue ?? "").replace(/\D/g, ""));
  return (
    <>
      <input type="hidden" name={name} value={raw} />
      <input inputMode="numeric" autoComplete="off" value={fmt(raw)} placeholder={placeholder} className={className}
        onChange={(e) => setRaw(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 10))} />
    </>
  );
}

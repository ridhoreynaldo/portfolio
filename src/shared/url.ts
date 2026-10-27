/**
 * Hanya http(s) yang boleh dirender sebagai href/src. Mencegah stored-XSS lewat
 * `javascript:`/`data:` yang diinput editor konten. Dipakai saat validasi DAN saat render.
 */
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Nomor telepon lokal → tautan wa.me (Indonesia default). */
/** Tautan wa.me; `text` (opsional) jadi pesan awal. */
export function waLink(phone: string, text?: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const intl = digits.startsWith("0") ? "62" + digits.slice(1) : digits;
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

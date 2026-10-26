import "server-only";
import { AppError } from "@/shared/errors";

export const IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp"] as const;
export const PROOF_MIMES = [...IMAGE_MIMES, "application/pdf"] as const;
export const MAX_UPLOAD = 3 * 1024 * 1024; // 3 MB — di bawah bodySizeLimit server action (next.config)

/** Ambil file dari FormData; null bila kosong. Validasi tipe & ukuran, lempar AppError bila tidak valid. */
export async function readUpload(form: FormData, field: string, mimes: readonly string[], label = "File") {
  const f = form.get(field);
  if (!(f instanceof File) || f.size === 0) return null;
  if (f.size > MAX_UPLOAD) throw new AppError(`${label} maksimal ${Math.round(MAX_UPLOAD / 1024 / 1024)} MB`);
  if (!mimes.includes(f.type)) throw new AppError(`${label} harus ${mimes.map((m) => m.split("/")[1]).join("/")}`);
  const data = Buffer.from(await f.arrayBuffer());
  // sniff header supaya tipe tidak sekadar dari nama file
  const ok =
    (f.type === "image/png" && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
    (f.type === "image/jpeg" && data[0] === 0xff && data[1] === 0xd8) ||
    (f.type === "image/webp" && data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP") ||
    (f.type === "application/pdf" && data.subarray(0, 5).toString("ascii") === "%PDF-");
  if (!ok) throw new AppError(`${label} rusak atau tipenya tidak cocok`);
  return { name: f.name.slice(0, 255) || "file", mime: f.type, size: f.size, data };
}

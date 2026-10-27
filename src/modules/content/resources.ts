// Definisi deklaratif modul konten sederhana (pengalaman, sertifikasi, skill).
// Form, tabel, validasi, dan permission dibuat otomatis dari config ini.
// Project & Profil punya form sendiri karena field-nya lebih kompleks.
import { AppError } from "@/shared/errors";
import { safeUrl } from "@/shared/url";
import { EXP_ICON_NAMES } from "@/components/exp-icon";

export type FieldType = "text" | "textarea" | "number" | "date" | "checkbox" | "url" | "select";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  options?: readonly string[]; // select
};

export type ResourceKey = "experience" | "certification" | "skill";

export type ResourceConfig = {
  key: ResourceKey; // segmen URL /admin/<key> sekaligus prefix permission
  title: string;
  fields: Field[];
  columns: string[]; // field yang tampil di tabel
};

export const RESOURCES: ResourceConfig[] = [
  {
    key: "experience",
    title: "Pengalaman",
    columns: ["position", "company", "startDate", "endDate", "isCurrent"],
    fields: [
      { name: "position", label: "Posisi", type: "text", required: true },
      { name: "company", label: "Perusahaan", type: "text", required: true },
      { name: "location", label: "Lokasi", type: "text" },
      { name: "startDate", label: "Mulai", type: "text", required: true, placeholder: "Jan 2022" },
      { name: "endDate", label: "Selesai", type: "text", placeholder: "Des 2023 (kosongkan jika masih berjalan)" },
      { name: "isCurrent", label: "Masih berjalan", type: "checkbox" },
      { name: "description", label: "Deskripsi", type: "textarea", required: true },
      { name: "icon", label: "Ikon", type: "select", options: EXP_ICON_NAMES },
      { name: "sortOrder", label: "Urutan", type: "number", min: 0, max: 9999 },
    ],
  },
  {
    key: "certification",
    title: "Sertifikasi",
    columns: ["name", "issuer", "issueDate", "expiryDate"],
    fields: [
      { name: "name", label: "Nama Sertifikat", type: "text", required: true },
      { name: "issuer", label: "Penerbit", type: "text", required: true },
      { name: "issueDate", label: "Tanggal Terbit", type: "date", required: true },
      { name: "expiryDate", label: "Kedaluwarsa", type: "date" },
      { name: "credentialUrl", label: "URL Kredensial", type: "url" },
      { name: "sortOrder", label: "Urutan", type: "number", min: 0, max: 9999 },
    ],
  },
  {
    key: "skill",
    title: "Skill",
    columns: ["name", "category", "level"],
    fields: [
      { name: "name", label: "Nama Skill", type: "text", required: true },
      { name: "category", label: "Kategori", type: "text", placeholder: "Language / Framework / Database …" },
      { name: "level", label: "Level (0–100)", type: "number", required: true, min: 0, max: 100 },
      { name: "sortOrder", label: "Urutan", type: "number", min: 0, max: 9999 },
    ],
  },
];

export const getResource = (key: string) => RESOURCES.find((r) => r.key === key);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** FormData → objek siap insert/update sesuai definisi field; lempar AppError bila tidak valid. */
export function parseForm(fields: Field[], fd: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = fd.get(f.name);
    const str = typeof raw === "string" ? raw.trim() : "";
    switch (f.type) {
      case "checkbox":
        data[f.name] = raw === "on";
        break;
      case "number": {
        if (str === "") {
          if (f.required) throw new AppError(`${f.label} wajib diisi`);
          data[f.name] = f.name === "sortOrder" || f.name === "level" ? 0 : null;
          break;
        }
        const n = Number(str);
        if (!Number.isFinite(n)) throw new AppError(`${f.label} harus angka`);
        if (f.min !== undefined && n < f.min) throw new AppError(`${f.label} minimal ${f.min}`);
        if (f.max !== undefined && n > f.max) throw new AppError(`${f.label} maksimal ${f.max}`);
        data[f.name] = Math.trunc(n);
        break;
      }
      case "date":
        if (str && !DATE_RE.test(str)) throw new AppError(`${f.label} format tanggal tidak valid`);
        data[f.name] = str || null;
        break;
      case "url":
        if (str && !safeUrl(str)) throw new AppError(`${f.label} harus URL http(s) yang valid`);
        data[f.name] = str;
        break;
      case "select":
        if (str && f.options && !f.options.includes(str)) throw new AppError(`${f.label} tidak valid`);
        data[f.name] = str || null;
        break;
      default:
        if (str.length > 5000) throw new AppError(`${f.label} terlalu panjang`);
        data[f.name] = str || (f.required ? "" : f.type === "textarea" ? "" : null);
    }
    if (f.required && (data[f.name] === "" || data[f.name] === null)) throw new AppError(`${f.label} wajib diisi`);
  }
  return data;
}

/** Field form profil (singleton). Tipe url divalidasi http(s) oleh parseForm. */
export const PROFILE_FIELDS: Field[] = [
  { name: "siteName", label: "Nama situs / brand (navbar)", type: "text", required: true },
  { name: "fullName", label: "Nama lengkap", type: "text", required: true },
  { name: "serviceBrand", label: "Brand jasa (halaman /jasa, login, portal)", type: "text", placeholder: "Kodeva" },
  { name: "serviceTagline", label: "Tagline brand jasa", type: "text", placeholder: "Solusi software, cloud & AI untuk bisnis Anda" },
  { name: "headline", label: "Judul hero", type: "text", placeholder: "Halo, saya Ridho — Full-Stack Developer" },
  { name: "tagline", label: "Tagline (badge kecil)", type: "text" },
  { name: "summary", label: "Sub-judul hero", type: "textarea" },
  { name: "about", label: "Tentang saya", type: "textarea" },
  { name: "photoUrl", label: "URL foto", type: "url" },
  { name: "email", label: "Email", type: "text" },
  { name: "phone", label: "Telepon / WhatsApp", type: "text" },
  { name: "location", label: "Domisili", type: "text" },
  { name: "birthPlace", label: "Tempat lahir", type: "text" },
  { name: "birthDate", label: "Tanggal lahir", type: "date" },
  { name: "gender", label: "Jenis kelamin", type: "text" },
  { name: "nationality", label: "Kewarganegaraan", type: "text" },
  { name: "religion", label: "Agama", type: "text" },
  { name: "maritalStatus", label: "Status pernikahan", type: "text" },
  { name: "website", label: "Website", type: "url" },
  { name: "github", label: "GitHub", type: "url" },
  { name: "linkedin", label: "LinkedIn", type: "url" },
];

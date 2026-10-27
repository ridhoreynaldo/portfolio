import { safeUrl } from "@/shared/url";

/** Inisial 1–2 huruf dari nama organisasi, mis. "Bank Rakyat Indonesia (BRI)" → "BR". */
export function initialsOf(name: string) {
  const words = name.replace(/\(.*?\)/g, " ").split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1 && !/^(dan|and|of|the|x|×|by|-)$/i.test(w));
  return ((words[0]?.[0] ?? name[0] ?? "?") + (words[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Logo perusahaan/penerbit untuk kartu pengalaman & sertifikasi (tema galactic).
 * Tanpa URL yang valid → kotak inisial, jadi tata letak tetap rapi.
 */
export function OrgLogo({ src, name, size = "md" }: { src?: string | null; name: string; size?: "md" | "lg" }) {
  const url = safeUrl(src ?? "");
  const box = size === "lg" ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";
  return (
    <span className={`${box} grid shrink-0 place-items-center overflow-hidden rounded-lg border border-cyan-300/30 bg-white/95 p-1 shadow-[0_0_12px_rgba(0,240,255,0.25)]`} title={name}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`Logo ${name}`} loading="lazy" className="h-full w-full object-contain" />
      ) : (
        <span className="font-display font-bold text-[#0b1230]" aria-label={name}>{initialsOf(name)}</span>
      )}
    </span>
  );
}

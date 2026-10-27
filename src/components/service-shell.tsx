import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import type { AuthUser } from "@/modules/auth/session";

/** Logo brand jasa (SVG di public/). */
export const SERVICE_LOGO = "/service-logo.svg";
/** Nama & tagline brand jasa cadangan bila kolom profil masih kosong (ubah di Admin > Profil). */
export const SERVICE_BRAND_FALLBACK = "Kodeva";
export const SERVICE_TAGLINE_FALLBACK = "Solusi software, cloud & AI untuk bisnis Anda";

export type ServiceBrand = { name: string; tagline: string; owner: string };
export const serviceBrandOf = (p: { serviceBrand?: string; serviceTagline?: string; fullName?: string } | null | undefined): ServiceBrand => ({
  name: p?.serviceBrand || SERVICE_BRAND_FALLBACK,
  tagline: p?.serviceTagline || SERVICE_TAGLINE_FALLBACK,
  owner: p?.fullName || "Pemilik",
});

const NAV = [
  ["/jasa#layanan", "Layanan"],
  ["/jasa#cara-kerja", "Cara Kerja"],
  ["/jasa#paket", "Paket"],
  ["/jasa#faq", "FAQ"],
  ["/jasa#kontak", "Kontak"],
] as const;

/** Header halaman jasa (tema svc, terang & klasik). Tidak memakai menu portofolio. */
export function ServiceHeader({ brand, user }: { brand: ServiceBrand; user: AuthUser | null }) {
  const portal = user ? (user.isSuper || user.permissions.length > 0 ? "/admin" : "/portal") : null;
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-[rgba(250,247,241,0.85)] backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/jasa" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SERVICE_LOGO} alt="" className="h-10 w-10" />
          <span className="leading-tight">
            <span className="font-serif block text-xl font-semibold tracking-wide text-[var(--navy)]">{brand.name}</span>
            <span className="block text-[11px] text-[var(--ink-3)]">oleh <Link href="/" className="underline-offset-2 hover:text-[var(--navy)] hover:underline">{brand.owner}</Link></span>
          </span>
        </Link>
        <ul className="hidden items-center gap-6 text-sm font-medium text-[var(--ink-2)] md:flex">
          {NAV.map(([href, label]) => <li key={href}><a href={href} className="transition hover:text-[var(--navy)]">{label}</a></li>)}
        </ul>
        <div className="flex items-center gap-2">
          {portal ? (
            <Link href={portal} className="btn-ghost btn-sm"><UserRound className="h-3.5 w-3.5" /> {user!.name.split(" ")[0]}</Link>
          ) : (
            <Link href="/jasa#masuk" className="btn-ghost btn-sm"><LogIn className="h-3.5 w-3.5" /> Masuk</Link>
          )}
          <Link href="/jasa#paket" className="btn-primary btn-sm">Pesan</Link>
        </div>
      </nav>
    </header>
  );
}

export function ServiceFooter({ brand }: { brand: ServiceBrand }) {
  return (
    <footer className="border-t border-[var(--rule)] bg-white/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-center text-xs text-[var(--ink-3)] md:flex-row md:text-left">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SERVICE_LOGO} alt="" className="h-7 w-7" />
          <span><span className="font-serif text-sm font-semibold text-[var(--navy)]">{brand.name}</span> · {brand.tagline}</span>
        </div>
        <p>© {new Date().getFullYear()} {brand.name} · dikelola oleh <Link href="/" className="text-[var(--navy)] hover:underline">{brand.owner}</Link></p>
      </div>
    </footer>
  );
}

/** Blok identitas brand untuk halaman kecil (login/daftar). */
export function ServiceBrandMark({ brand, title, sub }: { brand: ServiceBrand; title: string; sub: string }) {
  return (
    <div className="mb-6 text-center">
      <Link href="/jasa" className="inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SERVICE_LOGO} alt="" className="mx-auto h-14 w-14" />
      </Link>
      <p className="font-serif mt-3 text-lg font-semibold tracking-wide text-[var(--navy)]">{brand.name}</p>
      <p className="text-[11px] text-[var(--ink-3)]">oleh <Link href="/" className="hover:underline">{brand.owner}</Link></p>
      <h1 className="font-serif mt-5 text-2xl font-semibold text-[var(--ink)]">{title}</h1>
      <p className="mt-1 text-sm text-[var(--ink-3)]">{sub}</p>
    </div>
  );
}

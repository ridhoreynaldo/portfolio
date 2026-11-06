"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { CYCLE, fmtIDR } from "@/modules/billing/labels";
import type { BillingCycle, PriceTier } from "@/modules/billing/schema";

export type PkgCard = {
  id: string; slug: string; name: string; description: string; features: string[];
  priceTiers: PriceTier[]; price: number; billingCycle: BillingCycle; unit: string | null; isFeatured: boolean;
  wa: string | null;
};
export type PkgGroup = { key: string; title: string; sub?: string; items: PkgCard[] };

const MAX_FEATURES = 4;

function PriceLine({ p, showPrices }: { p: PkgCard; showPrices: boolean }) {
  const tierMin = Math.min(...p.priceTiers.map((t) => t.price).filter((n) => n > 0));
  const per = `${CYCLE[p.billingCycle]}${p.unit ? ` / ${p.unit}` : ""}`;
  if (Number.isFinite(tierMin)) return (<><p className="text-xs text-[var(--ink-3)]">Mulai dari</p><p className="text-xl font-bold text-[var(--ink)]">{fmtIDR(tierMin)}</p><p className="text-xs text-[var(--ink-3)]">{per}</p></>);
  if (showPrices && p.price > 0) return (<><p className="text-xs text-[var(--ink-3)]">Harga</p><p className="text-xl font-bold text-[var(--ink)]">{fmtIDR(p.price)}</p><p className="text-xs text-[var(--ink-3)]">{per}</p></>);
  return (<><p className="text-xs text-[var(--ink-3)]">Harga</p><p className="text-base font-bold text-[var(--ink)]">Sesuai kebutuhan</p><p className="text-xs text-[var(--ink-3)]">{per}</p></>);
}

/** Paket dikelompokkan per kategori dalam tab; kartu ringkas, detail harga di halaman paket. */
export function PackageTabs({ groups, showPrices }: { groups: PkgGroup[]; showPrices: boolean }) {
  const [tab, setTab] = useState(groups[0]?.key ?? "");
  // tautan #paket-<kategori> (dari kartu layanan) memilih tab yang sesuai
  useEffect(() => {
    const pick = () => {
      const k = window.location.hash.replace(/^#paket-/, "");
      if (k !== window.location.hash && groups.some((g) => g.key === k)) setTab(k);
    };
    pick();
    window.addEventListener("hashchange", pick);
    return () => window.removeEventListener("hashchange", pick);
  }, [groups]);

  const g = groups.find((x) => x.key === tab) ?? groups[0];
  if (!g) return <p className="card p-8 text-center text-[var(--ink-3)]">Belum ada paket layanan yang aktif.</p>;

  return (
    <div>
      {groups.map((x) => <span key={x.key} id={`paket-${x.key}`} className="block scroll-mt-28" aria-hidden />)}
      <div className="seg no-scrollbar" role="tablist" aria-label="Kategori paket">
        {groups.map((x) => (
          <button key={x.key} type="button" role="tab" aria-selected={x.key === g.key} aria-controls="paket-panel" onClick={() => setTab(x.key)}>
            {x.title} <span className="ml-1 text-xs font-medium text-[var(--ink-3)]">{x.items.length}</span>
          </button>
        ))}
      </div>

      <div id="paket-panel" role="tabpanel" className="mt-5">
        {g.sub && <p className="mb-5 max-w-3xl text-sm text-[var(--ink-2)]">{g.sub}</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {g.items.map((p) => (
            <article key={p.id} className={`card flex flex-col p-5 ${p.isFeatured ? "card-featured" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[1.05rem] font-bold leading-snug text-[var(--ink)]">{p.name}</h3>
                {p.isFeatured && <span className="tag tag-gold shrink-0">Terlaris</span>}
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--ink-2)]">{p.description}</p>
              {p.features.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-sm text-[var(--ink-2)]">
                  {p.features.slice(0, MAX_FEATURES).map((f) => <li key={f} className="check">{f}</li>)}
                  {p.features.length > MAX_FEATURES && <li className="pl-7 text-xs text-[var(--ink-3)]">+{p.features.length - MAX_FEATURES} lainnya</li>}
                </ul>
              )}
              <div className="mt-auto pt-5">
                <div className="border-t border-[var(--line)] pt-4"><PriceLine p={p} showPrices={showPrices} /></div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href={`/medan/order/${p.slug}`} className="btn-ghost btn-sm">Detail <ArrowRight className="h-3.5 w-3.5" /></Link>
                  {p.wa
                    ? <a href={p.wa} target="_blank" rel="noreferrer" className="btn-primary btn-sm"><MessageCircle className="h-3.5 w-3.5" /> Tanya</a>
                    : <Link href={`/medan/order/${p.slug}`} className="btn-primary btn-sm">Pesan</Link>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { CYCLE, fmtIDR } from "@/modules/billing/labels";
import type { BillingCycle, PriceTier } from "@/modules/billing/schema";

export type PkgCard = {
  id: string; slug: string; name: string; description: string;
  priceTiers: PriceTier[]; price: number; billingCycle: BillingCycle; unit: string | null; isFeatured: boolean;
};
export type PkgGroup = { key: string; title: string; items: PkgCard[] };

function price(p: PkgCard, showPrices: boolean) {
  const min = Math.min(...p.priceTiers.map((t) => t.price).filter((n) => n > 0));
  if (Number.isFinite(min)) return { top: "Mulai", value: fmtIDR(min) };
  if (showPrices && p.price > 0) return { top: "", value: fmtIDR(p.price) };
  return { top: "", value: "Hubungi kami" };
}

/** Paket per kategori dalam tab. Kartu berisi nama, deskripsi singkat, harga; detail di halaman paket. */
export function PackageTabs({ groups, showPrices }: { groups: PkgGroup[]; showPrices: boolean }) {
  const [tab, setTab] = useState(groups[0]?.key ?? "");
  const g = groups.find((x) => x.key === tab) ?? groups[0];
  if (!g) return <p className="text-center text-[var(--ink-3)]">Belum ada paket yang aktif.</p>;

  return (
    <div>
      {groups.length > 1 && (
        <div className="seg no-scrollbar mx-auto mb-6 max-w-xl" role="tablist" aria-label="Kategori paket">
          {groups.map((x) => (
            <button key={x.key} type="button" role="tab" aria-selected={x.key === g.key} onClick={() => setTab(x.key)}>{x.title}</button>
          ))}
        </div>
      )}

      <div role="tabpanel" className="grid gap-3 md:grid-cols-2">
        {g.items.map((p) => {
          const pr = price(p, showPrices);
          return (
            <Link key={p.id} href={`/medan/order/${p.slug}`} className="card card-link group flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold leading-snug text-[var(--ink)]">{p.name}</h3>
                {p.isFeatured && <span className="tag tag-gold shrink-0">Terlaris</span>}
              </div>
              <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-[var(--ink-3)]">{p.description}</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-[var(--ink)]">
                  {pr.top && <span className="text-xs text-[var(--ink-3)]">{pr.top} </span>}
                  <span className="text-lg font-bold">{pr.value}</span>
                  <span className="text-xs text-[var(--ink-3)]"> {CYCLE[p.billingCycle]}</span>
                </p>
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--brand-ink)]">Detail <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { PageHeader } from "@/components/lc/ui";

// Primitif portal pelanggan: diteruskan dari komponen UI Leetcloud bersama.
export { Pill, Stat, type Tone } from "@/components/lc/ui";

export const pth = "";
export const ptd = "";

export function PortalTitle({ eyebrow, title, right, sub }: { eyebrow?: string; title: ReactNode; right?: ReactNode; sub?: ReactNode }) {
  return <PageHeader eyebrow={eyebrow} title={title} sub={sub} actions={right} />;
}

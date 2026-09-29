import type { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 transition-transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <span className={`rounded-xl bg-white/5 p-2.5 ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="font-display mt-3 text-4xl font-extrabold text-white">
        {value}
      </div>
    </div>
  );
}

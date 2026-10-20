import { Briefcase, Cloud, Code2, Database, GraduationCap, Globe, Rocket, Server, Smartphone, Users, Wrench, type LucideIcon } from "lucide-react";

const ICONS = {
  briefcase: Briefcase,
  code: Code2,
  server: Server,
  database: Database,
  cloud: Cloud,
  smartphone: Smartphone,
  globe: Globe,
  wrench: Wrench,
  rocket: Rocket,
  users: Users,
  graduation: GraduationCap,
} satisfies Record<string, LucideIcon>;

export const EXP_ICON_NAMES = Object.keys(ICONS) as readonly (keyof typeof ICONS)[];

export function ExpIcon({ icon, className = "h-4 w-4" }: { icon?: string | null; className?: string }) {
  const Icon = (icon && ICONS[icon.toLowerCase() as keyof typeof ICONS]) || Briefcase;
  return <Icon className={className} aria-hidden />;
}

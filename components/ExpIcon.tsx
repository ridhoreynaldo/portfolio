import {
  Briefcase,
  Cloud,
  Code2,
  Database,
  Globe,
  Rocket,
  Server,
  Smartphone,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
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
};

export default function ExpIcon({
  icon,
  className = "h-4 w-4",
}: {
  icon?: string | null;
  className?: string;
}) {
  const Icon = (icon && ICONS[icon.toLowerCase()]) || Briefcase;
  return <Icon className={className} aria-hidden />;
}

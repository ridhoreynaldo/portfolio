import { Code2 } from "lucide-react";
import type { IconType } from "react-icons";
import {
  SiCss,
  SiDocker,
  SiDrizzle,
  SiGit,
  SiGo,
  SiHtml5,
  SiJavascript,
  SiLaravel,
  SiLinux,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNginx,
  SiNodedotjs,
  SiPhp,
  SiPostgresql,
  SiPrisma,
  SiPython,
  SiReact,
  SiRedis,
  SiTailwindcss,
  SiTypescript,
  SiVuedotjs,
} from "react-icons/si";

// Normalisasi: lowercase + buang spasi, titik, strip, underscore, plus, slash
function normalize(name: string): string {
  return name.toLowerCase().replace(/[\s._\-+/]/g, "");
}

const ICONS: Record<string, IconType> = {
  nodejs: SiNodedotjs,
  node: SiNodedotjs,
  react: SiReact,
  reactjs: SiReact,
  nextjs: SiNextdotjs,
  next: SiNextdotjs,
  typescript: SiTypescript,
  ts: SiTypescript,
  javascript: SiJavascript,
  js: SiJavascript,
  postgresql: SiPostgresql,
  postgres: SiPostgresql,
  pgsql: SiPostgresql,
  mysql: SiMysql,
  docker: SiDocker,
  laravel: SiLaravel,
  php: SiPhp,
  python: SiPython,
  tailwind: SiTailwindcss,
  tailwindcss: SiTailwindcss,
  redis: SiRedis,
  nginx: SiNginx,
  git: SiGit,
  linux: SiLinux,
  mongodb: SiMongodb,
  mongo: SiMongodb,
  prisma: SiPrisma,
  vue: SiVuedotjs,
  vuejs: SiVuedotjs,
  go: SiGo,
  golang: SiGo,
  html: SiHtml5,
  html5: SiHtml5,
  css: SiCss,
  css3: SiCss,
  drizzle: SiDrizzle,
  drizzleorm: SiDrizzle,
};

export default function TechIcon({
  name,
  className = "h-4 w-4",
  iconUrl,
}: {
  name: string;
  className?: string;
  /** URL icon custom per tag — bila diisi, dipakai sebagai pengganti icon otomatis */
  iconUrl?: string | null;
}) {
  if (iconUrl?.trim()) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={iconUrl.trim()}
        alt={name}
        title={name}
        className={`${className} rounded-sm object-contain`}
        loading="lazy"
      />
    );
  }
  const Icon = ICONS[normalize(name)] ?? Code2;
  return <Icon className={className} title={name} aria-label={name} />;
}

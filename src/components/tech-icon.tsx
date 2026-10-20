import { Code2 } from "lucide-react";
import type { IconType } from "react-icons";
import {
  SiCss, SiDocker, SiDrizzle, SiGit, SiGo, SiHtml5, SiJavascript, SiLaravel, SiLinux, SiMongodb, SiMysql, SiNextdotjs, SiNginx,
  SiNodedotjs, SiPhp, SiPostgresql, SiPrisma, SiPython, SiReact, SiRedis, SiTailwindcss, SiTypescript, SiVuedotjs,
} from "react-icons/si";
import { safeUrl } from "@/shared/url";

const normalize = (name: string) => name.toLowerCase().replace(/[\s._\-+/]/g, "");

const ICONS: Record<string, IconType> = {
  nodejs: SiNodedotjs, node: SiNodedotjs, react: SiReact, reactjs: SiReact, nextjs: SiNextdotjs, next: SiNextdotjs,
  typescript: SiTypescript, ts: SiTypescript, javascript: SiJavascript, js: SiJavascript, postgresql: SiPostgresql, postgres: SiPostgresql,
  pgsql: SiPostgresql, mysql: SiMysql, docker: SiDocker, laravel: SiLaravel, php: SiPhp, python: SiPython, tailwind: SiTailwindcss,
  tailwindcss: SiTailwindcss, redis: SiRedis, nginx: SiNginx, git: SiGit, linux: SiLinux, mongodb: SiMongodb, mongo: SiMongodb,
  prisma: SiPrisma, vue: SiVuedotjs, vuejs: SiVuedotjs, go: SiGo, golang: SiGo, html: SiHtml5, html5: SiHtml5, css: SiCss, css3: SiCss,
  drizzle: SiDrizzle, drizzleorm: SiDrizzle,
};

/** Ikon teknologi otomatis dari nama; `iconUrl` kustom (http/https) menggantikannya. */
export function TechIcon({ name, className = "h-4 w-4", iconUrl }: { name: string; className?: string; iconUrl?: string | null }) {
  const custom = safeUrl(iconUrl);
  if (custom) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={custom} alt={name} title={name} className={`${className} rounded-sm object-contain`} loading="lazy" />;
  }
  const Icon = ICONS[normalize(name)] ?? Code2;
  return <Icon className={className} title={name} aria-label={name} />;
}

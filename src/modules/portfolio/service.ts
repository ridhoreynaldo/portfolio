import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/shared/db";
import { publicMenus } from "@/modules/menus/repository";
import { certifications, experiences, profile, projects, skills } from "@/modules/content/schema";
import { servicePackages } from "@/modules/billing/schema";

export const PORTFOLIO_TAG = "portfolio";

/**
 * View-model halaman publik. Semua nilai JSON-safe (tanggal = string) supaya bisa di-cache.
 * Dihitung ulang hanya saat konten berubah (revalidatePortfolio) atau maksimal tiap 1 jam.
 */
async function load() {
  const [prof, menus, exps, certs, sks, projs, pkgs] = await Promise.all([
    db().select().from(profile).where(eq(profile.id, 1)).limit(1),
    publicMenus(),
    db()
      .select({
        id: experiences.id, company: experiences.company, position: experiences.position, location: experiences.location,
        startDate: experiences.startDate, endDate: experiences.endDate, isCurrent: experiences.isCurrent,
        description: experiences.description, icon: experiences.icon,
      })
      .from(experiences)
      .orderBy(asc(experiences.sortOrder), desc(experiences.createdAt)),
    db()
      .select({ id: certifications.id, name: certifications.name, issuer: certifications.issuer, issueDate: certifications.issueDate, expiryDate: certifications.expiryDate, credentialUrl: certifications.credentialUrl })
      .from(certifications)
      .orderBy(asc(certifications.sortOrder), desc(certifications.issueDate)),
    db().select({ id: skills.id, name: skills.name, category: skills.category, level: skills.level }).from(skills).orderBy(asc(skills.category), asc(skills.sortOrder)),
    db()
      .select({
        id: projects.id, title: projects.title, slug: projects.slug, description: projects.description, detailDescription: projects.detailDescription,
        role: projects.role, year: projects.year, imageUrl: projects.imageUrl, tags: projects.tags, techStack: projects.techStack, tagIcons: projects.tagIcons,
        totalUsers: projects.totalUsers, concurrentUsers: projects.concurrentUsers, demoUrl: projects.demoUrl, repoUrl: projects.repoUrl, isFeatured: projects.isFeatured,
      })
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(desc(projects.isFeatured), asc(projects.sortOrder), desc(projects.createdAt)),
    db()
      .select({
        id: servicePackages.id, name: servicePackages.name, slug: servicePackages.slug, category: servicePackages.category, description: servicePackages.description,
        features: servicePackages.features, price: servicePackages.price, priceTiers: servicePackages.priceTiers, billingCycle: servicePackages.billingCycle, unit: servicePackages.unit, isFeatured: servicePackages.isFeatured,
      })
      .from(servicePackages)
      .where(eq(servicePackages.isActive, true))
      .orderBy(desc(servicePackages.isFeatured), asc(servicePackages.sortOrder), asc(servicePackages.name)),
  ]);
  const p = prof[0];
  return {
    profile: p ? { ...p, updatedAt: undefined } : null,
    menus,
    experiences: exps,
    certifications: certs,
    skills: sks,
    projects: projs,
    packages: pkgs,
  };
}

export type PortfolioData = Awaited<ReturnType<typeof load>>;
export type PublicProject = PortfolioData["projects"][number];

export const getPortfolio = unstable_cache(load, [PORTFOLIO_TAG], { tags: [PORTFOLIO_TAG], revalidate: 3600 });

/** Dipanggil setiap server action yang mengubah konten/menu publik. */
export const revalidatePortfolio = () => revalidateTag(PORTFOLIO_TAG, "max");

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { action, setFlash } from "@/shared/action";
import { notFound } from "@/shared/errors";
import { safeUrl } from "@/shared/url";
import { requirePermission } from "@/modules/auth/guards";
import { revalidatePortfolio } from "@/modules/portfolio/service";
import { PROFILE_FIELDS, getResource, parseForm } from "./resources";
import {
  deleteProject, deleteRow, getProject, insertProject, insertRow, listRows, slugify, uniqueSlug, updateProject, updateRow, upsertProfile,
} from "./repository";

const uuid = z.string().uuid();

// ── Resource generik ──────────────────────────────────────────────────────────
export const saveResourceAction = action(async (key: string, form: FormData) => {
  const res = getResource(key);
  if (!res) throw notFound("Resource tidak dikenal");
  const id = String(form.get("id") || "") || undefined;
  await requirePermission(`${res.key}.${id ? "update" : "create"}`);
  const data = parseForm(res.fields, form);
  if (id) {
    uuid.parse(id);
    await updateRow(res.key, id, data);
  } else await insertRow(res.key, data);
  revalidatePath(`/admin/${res.key}`);
  revalidatePortfolio();
  await setFlash(`${res.title} tersimpan`);
  redirect(`/admin/${res.key}`);
});

export const deleteResourceAction = action(async (key: string, form: FormData) => {
  const res = getResource(key);
  if (!res) throw notFound("Resource tidak dikenal");
  await requirePermission(`${res.key}.delete`);
  const id = uuid.parse(form.get("id"));
  if (!(await listRows(res.key)).some((r) => r.id === id)) throw notFound();
  await deleteRow(res.key, id);
  revalidatePath(`/admin/${res.key}`);
  revalidatePortfolio();
  await setFlash(`${res.title} dihapus`);
});

// ── Profil ────────────────────────────────────────────────────────────────────
export const saveProfileAction = action(async (form: FormData) => {
  await requirePermission("profile.update");
  const data = parseForm(PROFILE_FIELDS, form);
  // kolom teks di tabel profile NOT NULL default '' → null dari parser dinormalisasi
  for (const k of Object.keys(data)) if (data[k] === null && k !== "birthDate") data[k] = "";
  await upsertProfile(data);
  revalidatePath("/admin/profile");
  revalidatePortfolio();
  await setFlash("Profil tersimpan");
  redirect("/admin/profile");
});

// ── Project ───────────────────────────────────────────────────────────────────
const optUrl = z
  .string()
  .trim()
  .max(2000)
  .transform((s) => s || null)
  .refine((s) => s === null || !!safeUrl(s), "URL harus http(s) yang valid");
const list = (s: unknown) =>
  String(s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 30);

const projectInput = z.object({
  id: uuid.optional(),
  title: z.string().trim().min(2).max(255),
  slug: z.string().trim().max(80).default(""),
  description: z.string().trim().min(1).max(2000),
  detailDescription: z.string().trim().max(10_000).default(""),
  role: z.string().trim().max(128).default(""),
  year: z.union([z.literal(""), z.coerce.number().int().min(1990).max(2100)]).transform((v) => (v === "" ? null : v)),
  imageUrl: optUrl,
  demoUrl: optUrl,
  repoUrl: optUrl,
  totalUsers: z.string().trim().max(64).default(""),
  concurrentUsers: z.string().trim().max(64).default(""),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

/** Baris "Tag=https://…/icon.svg" → { Tag: url }; URL non-http dibuang. */
function parseTagIcons(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of String(raw ?? "").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i < 1) continue;
    const tag = line.slice(0, i).trim();
    const url = safeUrl(line.slice(i + 1));
    if (tag && url) out[tag] = url;
  }
  return out;
}

export const saveProjectAction = action(async (form: FormData) => {
  const id = String(form.get("id") || "") || undefined;
  await requirePermission(`project.${id ? "update" : "create"}`);
  const d = projectInput.parse({
    id,
    title: form.get("title"),
    slug: form.get("slug") ?? "",
    description: form.get("description"),
    detailDescription: form.get("detailDescription") ?? "",
    role: form.get("role") ?? "",
    year: form.get("year") ?? "",
    imageUrl: form.get("imageUrl") ?? "",
    demoUrl: form.get("demoUrl") ?? "",
    repoUrl: form.get("repoUrl") ?? "",
    totalUsers: form.get("totalUsers") ?? "",
    concurrentUsers: form.get("concurrentUsers") ?? "",
    isFeatured: form.get("isFeatured") === "on",
    isPublished: form.get("isPublished") === "on",
    sortOrder: form.get("sortOrder") || 0,
  });
  const tags = list(form.get("tags"));
  const techStack = list(form.get("techStack"));
  const tagIcons = parseTagIcons(form.get("tagIcons"));
  if (id && !(await getProject(id))) throw notFound();
  const slug = await uniqueSlug(slugify(d.slug || d.title), id);
  const values = {
    title: d.title,
    slug,
    description: d.description,
    detailDescription: d.detailDescription || null,
    role: d.role || null,
    year: d.year,
    imageUrl: d.imageUrl,
    demoUrl: d.demoUrl,
    repoUrl: d.repoUrl,
    totalUsers: d.totalUsers || null,
    concurrentUsers: d.concurrentUsers || null,
    tags,
    techStack,
    tagIcons,
    isFeatured: d.isFeatured,
    isPublished: d.isPublished,
    sortOrder: d.sortOrder,
  };
  if (id) await updateProject(id, values);
  else await insertProject(values);
  revalidatePath("/admin/projects");
  revalidatePortfolio();
  await setFlash(`Project "${d.title}" tersimpan`);
  redirect("/admin/projects");
});

export const deleteProjectAction = action(async (form: FormData) => {
  await requirePermission("project.delete");
  const id = uuid.parse(form.get("id"));
  const p = await getProject(id);
  if (!p) throw notFound();
  await deleteProject(id);
  revalidatePath("/admin/projects");
  revalidatePortfolio();
  await setFlash(`Project "${p.title}" dihapus`);
});

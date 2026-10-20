import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  /** URL lewat PgBouncer (transaction mode) — dipakai aplikasi. */
  DATABASE_URL: z.string().min(1),
  /** URL langsung ke Postgres — dipakai migrasi saja. */
  DATABASE_URL_DIRECT: z.string().optional(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(5),
  /** true jika diakses lewat HTTPS (produksi). */
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  TZ_APP: z.string().default("Asia/Jakarta"),
  /** Akun super admin pertama — hanya dipakai migrate/seed bila belum ada super admin. */
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Divalidasi lazily supaya `next build` tidak butuh env runtime. */
export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error("Env tidak valid: " + JSON.stringify(parsed.error.flatten().fieldErrors));
    }
    cached = parsed.data;
  }
  return cached;
}

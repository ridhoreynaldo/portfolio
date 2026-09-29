import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Pool TANPA argumen: node-postgres otomatis membaca PGHOST, PGPORT,
// PGUSER, PGPASSWORD, PGDATABASE dari environment.
// max kecil karena di belakang PgBouncer (transaction mode).
// Drizzle tidak memakai prepared statement bernama secara default,
// sehingga aman untuk PgBouncer transaction mode.
const pool = new Pool({ max: 10 });

export const db = drizzle(pool, { schema });
export { pool };

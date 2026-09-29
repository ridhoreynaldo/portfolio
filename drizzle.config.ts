import { defineConfig } from "drizzle-kit";

const {
  PGHOST = "localhost",
  PGPORT = "5432",
  PGUSER = "postgres",
  PGPASSWORD = "",
  PGDATABASE = "postgres",
} = process.env;

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: `postgresql://${PGUSER}:${encodeURIComponent(PGPASSWORD)}@${PGHOST}:${PGPORT}/${PGDATABASE}`,
  },
});

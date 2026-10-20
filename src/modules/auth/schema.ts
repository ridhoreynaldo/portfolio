import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "@/modules/users/schema";

/** Sesi login di DB (bisa dicabut), menggantikan JWT stateless versi lama. */
export const authSessions = pgTable(
  "auth_sessions",
  {
    /** sha256 dari token cookie — token asli tidak pernah disimpan. */
    id: text("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    ip: varchar("ip", { length: 64 }),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("auth_sessions_user_idx").on(t.userId), index("auth_sessions_exp_idx").on(t.expiresAt)],
);

import { getSession, type SessionPayload } from "./auth";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

/** super_admin selalu lolos; selain itu harus punya permission key. */
export async function requirePermission(key: string): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.roles.includes("super_admin")) return session;
  if (!session.perms.includes(key)) throw new Error("FORBIDDEN");
  return session;
}

export async function requireRole(role: string): Promise<SessionPayload> {
  const session = await requireSession();
  if (!session.roles.includes(role)) throw new Error("FORBIDDEN");
  return session;
}

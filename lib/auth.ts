import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "portfolio_token";
const EXPIRES_SECONDS = 60 * 60 * 24 * 7; // 7 hari

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  perms: string[];
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "dev-secret-change-me"
  );
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // tanpa SSL: cookie dikirim via HTTP biasa
    path: "/",
    maxAge: EXPIRES_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

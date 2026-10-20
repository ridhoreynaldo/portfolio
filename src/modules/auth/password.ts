import { randomBytes, scrypt as _scrypt, timingSafeEqual, type BinaryLike } from "node:crypto";
import bcrypt from "bcryptjs";

const scrypt = (pw: BinaryLike, salt: BinaryLike, len: number, opts: { N: number; r: number; p: number }) =>
  new Promise<Buffer>((res, rej) => _scrypt(pw, salt, len, { ...opts, maxmem: 128 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))));

const P = { N: 2 ** 15, r: 8, p: 1 };

/** Format: scrypt$<salt hex>$<hash hex> — tanpa dependency native. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, P);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

/**
 * Verifikasi hash scrypt (baru) maupun bcrypt `$2…` (akun dari versi lama).
 * `needsRehash` = true untuk bcrypt → pemanggil menyimpan ulang dengan scrypt.
 */
export async function verifyPassword(password: string, stored: string): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (stored.startsWith("$2")) {
    return { ok: await bcrypt.compare(password, stored), needsRehash: true };
  }
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return { ok: false, needsRehash: false };
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length, P);
  return { ok: timingSafeEqual(actual, expected), needsRehash: false };
}

/** Hash palsu untuk menyamakan waktu respons saat email tidak terdaftar (anti user-enumeration). */
export const DUMMY_HASH = "scrypt$00000000000000000000000000000000$" + "0".repeat(128);

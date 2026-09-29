"use client";

import { useEffect, useState } from "react";

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (res.status === 403) throw new Error("FORBIDDEN");
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : `Gagal (${res.status})`
    );
  }
  return res.json() as Promise<T>;
}

/** Hook polling sederhana untuk halaman admin. */
export function useAdminData<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      setData(await api<T>(url));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { data, error, loading, reload };
}

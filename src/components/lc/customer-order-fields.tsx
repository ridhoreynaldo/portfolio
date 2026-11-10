"use client";

import { useState } from "react";

type Cust = { id: string; name: string; email: string };
type Ord = { id: string; userId: string; number: string; packageName: string };

/** Pelanggan + "Order terkait": pilihan order hanya yang milik pelanggan terpilih. */
export function CustomerOrderFields({ customers, orders, userId, orderId }: { customers: Cust[]; orders: Ord[]; userId: string; orderId: string }) {
  const [uid, setUid] = useState(userId);
  const [oid, setOid] = useState(orderId);
  const mine = orders.filter((o) => o.userId === uid);
  return (
    <>
      <div>
        <label className="label">Pelanggan *</label>
        <select name="userId" required value={uid} onChange={(e) => { setUid(e.target.value); setOid(""); }} className="input-dark">
          <option value="">— pilih —</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Order terkait (opsional)</label>
        <select name="orderId" value={mine.some((o) => o.id === oid) ? oid : ""} onChange={(e) => setOid(e.target.value)} className="input-dark" disabled={!uid}>
          <option value="">{!uid ? "pilih pelanggan dulu" : mine.length ? "—" : "pelanggan ini belum punya layanan"}</option>
          {mine.map((o) => <option key={o.id} value={o.id}>{o.number} · {o.packageName}</option>)}
        </select>
      </div>
    </>
  );
}

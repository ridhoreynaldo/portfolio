import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["postgres"],
  // unggah QRIS / bukti bayar lewat server action (file ≤ 3 MB, lihat modules/billing/files.ts)
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};

export default config;

import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["postgres"],
  // unggah QRIS / bukti bayar lewat server action (file ≤ 3 MB, lihat modules/billing/files.ts)
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  // Rute lama Kodeva → semua di bawah /jasa (tautan lama tetap bekerja)
  async redirects() {
    return [
      { source: "/portal", destination: "/jasa/dashboard", permanent: true },
      { source: "/portal/orders", destination: "/jasa/dashboard", permanent: true },
      { source: "/portal/account", destination: "/jasa/dashboard/akun", permanent: true },
      { source: "/portal/invoices/:id", destination: "/jasa/dashboard/tagihan/:id", permanent: true },
      { source: "/jasa/dashboard/langganan", destination: "/jasa/dashboard", permanent: true },
      { source: "/order", destination: "/jasa#paket", permanent: true },
      { source: "/order/:slug", destination: "/jasa/order/:slug", permanent: true },
      { source: "/invoice/:id", destination: "/jasa/invoice/:id", permanent: true },
      { source: "/register", destination: "/jasa/register", permanent: true },
    ];
  },
};

export default config;

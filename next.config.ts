import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["postgres"],
  // unggah QRIS / bukti bayar lewat server action (file ≤ 3 MB, lihat modules/billing/files.ts)
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  // Layanan Leetcloud hidup di leetcloud.my.id/medan. Domain portofolio meneruskan /jasa & /medan ke sana;
  // domain Leetcloud tidak menampilkan portofolio (beranda & /login diarahkan ke /medan).
  async redirects() {
    const leet = [{ type: "host" as const, value: "leetcloud.my.id" }, { type: "host" as const, value: "www.leetcloud.my.id" }];
    const portfolioHost = [{ type: "host" as const, value: "(www\\.)?ridhoreynaldo\\.com" }];
    return [
      { source: "/", has: leet, destination: "/medan", permanent: false },
      { source: "/login", has: leet, destination: "/medan/login", permanent: false },
      // domain portofolio → Leetcloud
      { source: "/jasa", has: portfolioHost, destination: "https://leetcloud.my.id/medan", permanent: true },
      { source: "/jasa/:path*", has: portfolioHost, destination: "https://leetcloud.my.id/medan/:path*", permanent: true },
      { source: "/medan", has: portfolioHost, destination: "https://leetcloud.my.id/medan", permanent: true },
      { source: "/medan/:path*", has: portfolioHost, destination: "https://leetcloud.my.id/medan/:path*", permanent: true },
      // rute lama (tautan lama tetap bekerja)
      { source: "/jasa", destination: "/medan", permanent: true },
      { source: "/jasa/:path*", destination: "/medan/:path*", permanent: true },
      { source: "/portal", destination: "/medan/dashboard", permanent: true },
      { source: "/portal/orders", destination: "/medan/dashboard", permanent: true },
      { source: "/portal/account", destination: "/medan/dashboard/akun", permanent: true },
      { source: "/portal/invoices/:id", destination: "/medan/dashboard/tagihan/:id", permanent: true },
      { source: "/medan/dashboard/langganan", destination: "/medan/dashboard", permanent: true },
      { source: "/order", destination: "/medan#paket", permanent: true },
      { source: "/order/:slug", destination: "/medan/order/:slug", permanent: true },
      { source: "/invoice/:id", destination: "/medan/invoice/:id", permanent: true },
      { source: "/register", destination: "/medan/register", permanent: true },
    ];
  },
};

export default config;

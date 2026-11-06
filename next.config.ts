import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // perlindungan beda-versi setelah deploy (diisi release.sh dengan commit); kosong saat build lokal
  deploymentId: process.env.NEXT_DEPLOYMENT_ID || undefined,
  serverExternalPackages: ["postgres"],
  // unggah QRIS / bukti bayar lewat server action (file ≤ 3 MB, lihat modules/billing/files.ts)
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  // Leetcloud tampil di ROOT leetcloud.my.id (/, /login, /dashboard, /order/<slug>, /invoice/<id>, /register),
  // sementara kodenya tetap di folder app/medan (rewrite). URL lama /medan/... dialihkan ke versi tanpa /medan.
  // Domain portofolio meneruskan semua rute Leetcloud ke leetcloud.my.id.
  async redirects() {
    const leet = [{ type: "host" as const, value: "(www\\.)?leetcloud\\.my\\.id" }];
    const portfolioHost = [{ type: "host" as const, value: "(www\\.)?ridhoreynaldo\\.com" }];
    const L = "https://leetcloud.my.id";
    return [
      // leetcloud: buang /medan dari URL
      { source: "/medan", has: leet, destination: "/", permanent: true },
      { source: "/medan/:path*", has: leet, destination: "/:path*", permanent: true },
      // domain portofolio → Leetcloud
      ...["/jasa", "/medan"].flatMap((p) => [
        { source: p, has: portfolioHost, destination: L, permanent: true },
        { source: `${p}/:path*`, has: portfolioHost, destination: `${L}/:path*`, permanent: true },
      ]),
      ...["/dashboard/:path*", "/dashboard", "/order/:path*", "/invoice/:path*", "/register"].map((p) => ({ source: p, has: portfolioHost, destination: `${L}${p}`, permanent: true })),
      // panel admin DIPISAH: halaman jasa hanya di leetcloud.my.id, konten portofolio hanya di ridhoreynaldo.com
      { source: "/admin/:s(packages|orders|invoices|customers|payment)", has: portfolioHost, destination: `${L}/admin/:s`, permanent: false },
      { source: "/admin/:s(packages|orders|invoices|customers|payment)/:rest*", has: portfolioHost, destination: `${L}/admin/:s/:rest*`, permanent: false },
      { source: "/admin/:s(profile|experience|certification|skill|projects|menus|users|roles)", has: leet, destination: "https://ridhoreynaldo.com/admin/:s", permanent: false },
      { source: "/admin/:s(profile|experience|certification|skill|projects|menus|users|roles)/:rest*", has: leet, destination: "https://ridhoreynaldo.com/admin/:s/:rest*", permanent: false },
      // rute lama (tautan lama tetap bekerja)
      { source: "/jasa", destination: "/", permanent: true },
      { source: "/jasa/:path*", destination: "/:path*", permanent: true },
      { source: "/portal", destination: "/dashboard", permanent: true },
      { source: "/portal/orders", destination: "/dashboard", permanent: true },
      { source: "/portal/account", destination: "/dashboard/akun", permanent: true },
      { source: "/portal/invoices/:id", destination: "/dashboard/tagihan/:id", permanent: true },
      { source: "/dashboard/langganan", destination: "/dashboard", permanent: true },
      { source: "/order", destination: "/#paket", permanent: true },
    ];
  },
  async rewrites() {
    const leet = [{ type: "host" as const, value: "(www\\.)?leetcloud\\.my\\.id" }];
    return {
      beforeFiles: [
        { source: "/", has: leet, destination: "/medan" },
        // semua path tanpa titik (bukan file statis), kecuali admin/api/_next
        { source: "/:path((?!admin(?:/|$)|api/|_next/|medan(?:/|$))[^.]+)", has: leet, destination: "/medan/:path" },
      ],
    };
  },
};

export default config;

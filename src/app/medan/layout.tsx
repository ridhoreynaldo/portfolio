import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://leetcloud.my.id"),
  title: { default: "Leetcloud", template: "%s · Leetcloud" },
  description: "Jasa pembuatan aplikasi, sewa server & WhatsApp gateway untuk bisnis di Medan dan seluruh Indonesia.",
  icons: { icon: "/service-logo.svg", apple: "/service-logo.svg" },
  openGraph: { siteName: "Leetcloud", locale: "id_ID", type: "website" },
};

export default function MedanLayout({ children }: { children: React.ReactNode }) {
  return children;
}

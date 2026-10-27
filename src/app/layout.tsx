import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Orbitron, Playfair_Display } from "next/font/google";
import "./globals.css";

const display = Orbitron({ subsets: ["latin"], variable: "--font-orbitron", weight: ["500", "700", "900"] });
const body = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["500", "600", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["400", "600"] });

export const metadata: Metadata = {
  title: { default: "Portfolio", template: "%s · Portfolio" },
  description: "Portofolio, jasa pembuatan aplikasi & portal pelanggan",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} ${mono.variable} ${serif.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

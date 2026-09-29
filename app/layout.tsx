import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Starfield from "@/components/Starfield";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Portfolio profesional — proyek, pengalaman, dan kontak.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body
        className={`${display.variable} ${bodyFont.variable} font-body antialiased`}
      >
        <Starfield />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dsign Space",
  description:
    "Dhiya Ulhaq Mahmud is an Indonesian product designer crafting UI/UX interfaces, websites, and brand identities for growing teams. Explore portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

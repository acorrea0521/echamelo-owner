import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SplashGate } from "@/components/splash/SplashGate";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "¡ECHAMELO! — Subastas en vivo",
  description: "Subastas en transmisión en vivo. Mira, chatea y puja en tiempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SplashGate />
        {children}
      </body>
    </html>
  );
}

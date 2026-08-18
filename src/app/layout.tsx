import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/firebase/auth-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Treasure Hunt Platform | Cyber Security & Campus Navigation",
  description: "Next-generation digital interface for live physical campus treasure hunts.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#04070F] text-slate-100 antialiased min-h-screen relative font-sans">
        {/* Subtle scanline overlay */}
        <div className="fixed inset-0 scanline-overlay z-50 pointer-events-none opacity-30" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

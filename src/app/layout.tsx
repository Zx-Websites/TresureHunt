import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/firebase/auth-context";
import "./globals.css";

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#04070F] text-slate-100 antialiased min-h-screen relative font-sans">
        {/* Subtle scanline overlay */}
        <div className="fixed inset-0 scanline-overlay z-50 pointer-events-none opacity-30" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

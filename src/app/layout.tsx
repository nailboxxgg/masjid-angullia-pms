import type { Metadata } from "next";
import { Inter, Outfit, Scheherazade_New } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import OfflineIndicator from "@/components/ui/OfflineIndicator";
import { ThemeProvider } from "@/components/theme-provider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const scheherazade = Scheherazade_New({
  variable: "--font-scheherazade",
  weight: ["400", "700"],
  subsets: ["arabic"],
});

import GlobalModals from "@/components/layout/GlobalModals";

export const metadata: Metadata = {
  title: "Masjid Angullia Portal",
  description: "Comprehensive management system for our community",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} ${scheherazade.variable} antialiased transition-colors duration-300 no-scrollbar`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ServiceWorkerRegistration />
          <NavbarWrapper />
          <OfflineIndicator />
          <GlobalModals />
          <main className="min-h-screen flex flex-col bg-secondary-50 text-secondary-900 dark:bg-secondary-950 dark:text-secondary-100 transition-colors duration-300">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

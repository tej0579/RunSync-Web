import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthGate } from "@/components/layout/AuthGate";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "RunSync 2.0 — Cloud Extraction & Storage",
  description: "High-performance dataset and torrent cloud extraction pipeline",
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
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-slate-50 text-slate-900 dark:bg-[#060911] dark:text-slate-100 antialiased h-[100dvh] max-h-[100dvh] flex flex-col md:flex-row overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-white transition-colors duration-150`}
      >
        <ThemeProvider>
          <AuthGate>
            {/* Navigation: Responsive Topbar + Slide Drawer on Mobile, Fixed Sidebar on Desktop */}
            <Sidebar />

            {/* Independent Scrollable Content Area with Safe Bottom Padding */}
            <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-y-auto overscroll-y-contain">
              <main className="flex-1 px-3.5 sm:px-6 md:px-8 pt-5 sm:pt-6 pb-36 sm:pb-28 md:pb-16 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </AuthGate>
        </ThemeProvider>
      </body>
    </html>
  );
}

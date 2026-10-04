import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthGate } from "@/components/layout/AuthGate";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-[#080C14] text-slate-100 antialiased h-screen flex flex-col md:flex-row overflow-hidden`}
      >
        <AuthGate>
          {/* Navigation: Responsive Topbar + Slide Drawer on Mobile, Fixed Sidebar on Desktop */}
          <Sidebar />

          {/* Independent Scrollable Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
            <main className="flex-1 px-3.5 sm:px-6 md:px-8 pt-3.5 sm:pt-5 pb-6 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
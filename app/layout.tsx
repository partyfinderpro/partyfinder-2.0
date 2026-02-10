import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import DynamicCasinoBackground from "@/components/ui/DynamicCasinoBackground";
import LuxuryBottomNav from "@/components/ui/LuxuryBottomNav";
import AuthProvider from "@/components/AuthProvider"; // CORREGIDO: Ruta components

import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Venuz - Refugio VIP Nocturno",
  description: "Fiestas exclusivas, table dance, modelos y eventos en Puerto Vallarta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-vip-black text-white antialiased min-h-screen overflow-x-hidden">
        <AuthProvider>
          <DynamicCasinoBackground />

          <div className="relative z-10 pb-24"> {/* espacio para bottom nav */}
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </div>

          <LuxuryBottomNav />
          <PWAInstallPrompt />
          <PushNotificationPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}

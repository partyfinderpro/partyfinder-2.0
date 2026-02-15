export const dynamic = 'force-dynamic';
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/layout.css";
import { getMetadata } from "@/app/config/metadata";
import { getViewport } from "@/app/config/viewport";
import { getSchemaOrg } from "@/app/config/schema";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import CasinoThemeWrapper from "@/components/ui/CasinoThemeWrapper";

const inter = Inter({ subsets: ["latin"] });

// ============================================
// VENUZ PWA - Metadata & Viewport Configuration
// ============================================
export const metadata: Metadata = getMetadata();
export const viewport: Viewport = getViewport();

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const schemas = getSchemaOrg();

  return (
    <html lang="es-MX">
      <head>
        {/* Schema.org JSON-LD Schemas */}
        {schemas.map((schema, idx) => (
          <script
            key={idx}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}

        {/* Leaflet CSS para mapas */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>

      <body className={`${inter.className} bg-transparent text-white antialiased`}>
        <AuthProvider>
          <CasinoThemeWrapper>
            <div className="flex flex-col min-h-screen">
              {children}
              <Footer />
            </div>
          </CasinoThemeWrapper>
          <PWAInstallPrompt />
          <PushNotificationPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import AgeGate from "@/components/AgeGate";

const inter = Inter({ subsets: ["latin"] });

// ============================================
// VENUZ PWA - Metadata Configuration
// ============================================

const APP_NAME = "VENUZ";
const APP_DEFAULT_TITLE = "VENUZ - Entretenimiento Adulto México";
const APP_TITLE_TEMPLATE = "%s | VENUZ";
const APP_DESCRIPTION = "Descubre la mejor vida nocturna, escorts verificadas, clubs y eventos en México. Tu guía definitiva con geolocalización e inteligencia artificial.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    locale: "es_MX",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "VENUZ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },
  keywords: ["México", "vida nocturna", "escorts", "clubs", "PWA", "nightlife", "VENUZ"],
  authors: [{ name: "VENUZ", url: "https://venuz.app" }],
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <head>
        {/* Schema.org JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "VENUZ",
              "url": "https://venuz.com",
              "logo": "https://venuz.com/logo.png",
              "description": "La plataforma líder de entretenimiento adulto y vida nocturna en México",
              "foundingDate": "2025",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Puerto Vallarta",
                "addressRegion": "Jalisco",
                "addressCountry": "MX"
              },
              "sameAs": [
                "https://twitter.com/venuzapp",
                "https://telegram.me/venuzoficial"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "VENUZ",
              "url": "https://venuz.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://venuz.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {/* Leaflet CSS para mapas */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <AuthProvider>
          <AgeGate>
            {children}
            <Footer />
          </AgeGate>
          <PWAInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import AgeGate from "@/components/AgeGate";
import CasinoThemeWrapper from "@/components/ui/CasinoThemeWrapper";

const inter = Inter({ subsets: ["latin"] });

// ============================================
// VENUZ PWA - Metadata Configuration
// ============================================

const APP_NAME = "VENUZ";
const APP_DEFAULT_TITLE = "VENUZ - Entretenimiento Adulto México";
const APP_TITLE_TEMPLATE = "%s | VENUZ";
const APP_DESCRIPTION = "Descubre la mejor vida nocturna, perfiles verificados, clubs y eventos en México. Tu guía definitiva con geolocalización e inteligencia artificial.";

export const metadata: Metadata = {
  metadataBase: new URL('https://labelbabel.com'),
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
  keywords: ["México", "vida nocturna", "escorts", "escorts México", "clubs", "webcams", "eventos", "antros", "PWA", "nightlife", "VENUZ", "entretenimiento adulto", "acompañantes"],
  authors: [{ name: "VENUZ", url: "https://labelbabel.com" }],
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
              "url": "https://labelbabel.com",
              "logo": "https://labelbabel.com/logo.png",
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
              "url": "https://labelbabel.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://labelbabel.com/search?q={search_term_string}",
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
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Playfair+Display:wght@700&display=swap');

          body {
            /* Púrpura oscuro neón casino - Fallback si el componente react falla */
            background: linear-gradient(135deg, #0a0015 0%, #1a0033 50%, #330022 100%);
            color: #e6d9ff; /* Blanco lavanda suave */
            font-family: 'Playfair Display', serif;
            /* margin: 0; padding: 20px; Eliminados para no afectar layout nextjs */
            min-height: 100vh;
            background-attachment: fixed;
            position: relative;
          }

          /* Pulso neón overlay */
          body::after {
            content: "";
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at 30% 70%, rgba(147,0,255,0.12), transparent 40%),
                        radial-gradient(circle at 70% 30%, rgba(255,215,0,0.10), transparent 40%);
            animation: neonPulse 12s infinite alternate ease-in-out;
            z-index: -1;
            pointer-events: none;
          }

          @keyframes neonPulse {
            0% { opacity: 0.5; }
            100% { opacity: 0.85; }
          }

          /* Estilos para Headers Específicos (si se usan esas etiquetas) */
          h1, h2, h3 {
            color: #ffcc00; /* Oro vibrante */
            text-shadow: 0 0 12px #ff00aa, 0 0 24px #ffcc00, 0 0 36px #cc00ff; /* Glow multi neón */
            font-family: 'Orbitron', sans-serif;
          }

          /* Efectos Globales de Botones */
          button.venuz-neon-btn {
            background: linear-gradient(135deg, #ff0066, #cc00ff, #ff3399);
            color: #fff;
            border: none;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 0 20px rgba(255,0,102,0.7);
            transition: all 0.3s;
          }

          button.venuz-neon-btn:hover {
            background: linear-gradient(135deg, #ff3399, #ff00cc, #ff0066);
            box-shadow: 0 0 40px rgba(255,0,170,1);
            transform: scale(1.08);
          }
        `}} />
      </head>
      <body className={`${inter.className} bg-transparent text-white antialiased`}>
        <AuthProvider>
          <CasinoThemeWrapper>
            {/* Contenedor Flex para Footer Sticky */}
            <div className="flex flex-col min-h-screen">
              {/* <AgeGate> */}
              {children}
              <Footer />
              {/* v3.0-GOLD-VIP-DEPLOY - Force Cache Purge */}
              {/* </AgeGate> */}
            </div>
          </CasinoThemeWrapper>

          <PWAInstallPrompt />
          <PushNotificationPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}

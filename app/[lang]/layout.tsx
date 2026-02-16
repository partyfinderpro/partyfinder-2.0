export const dynamic = 'force-dynamic';
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import "../styles/layout.css";
import { getMetadata } from "@/app/config/metadata";
import { getViewport } from "@/app/config/viewport";
import { getSchemaOrg } from "@/app/config/schema";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import CasinoThemeWrapper from "@/components/ui/CasinoThemeWrapper";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = getMetadata();
export const viewport: Viewport = getViewport();

export default async function LocaleLayout({
  children,
  params: { lang }
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  // Validate that the incoming `locale` parameter is valid
  const locales = ['es', 'en', 'pt', 'fr'];
  if (!locales.includes(lang)) {
    notFound();
  }

  // Receive messages provided in `i18n.ts`
  const messages = await getMessages();
  const schemas = getSchemaOrg();

  return (
    <html lang={lang}>
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
        <NextIntlClientProvider messages={messages} locale={lang}>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

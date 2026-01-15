import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VENUZ - Tu Mundo de Entretenimiento Adulto',
  description: 'Descubre eventos, clubs, servicios y contenido para adultos cerca de ti',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VENUZ',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
}

import OnboardingModal from '@/components/OnboardingModal';
import NotificationBell from '@/components/NotificationBell';
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { SpeedInsights } from "@vercel/speed-insights/next"

// Client component for Service Worker registration
function ServiceWorkerRegistration() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  }
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className="overflow-x-hidden">
        {/* Background effects */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-venuz-pink opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-venuz-red opacity-10 rounded-full mix-blend-multiply filter blur-3xl animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-venuz-gold opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow animation-delay-4000" />
        </div>

        <AuthProvider>
          <PreferencesProvider>
            <OnboardingModal />

            {/* Global Notification Bell - Fixed Position */}
            <div className="fixed top-4 right-4 z-[100]">
              <NotificationBell />
            </div>

            {/* Main content */}
            <div className="relative z-10">
              {children}
              <SpeedInsights />
            </div>
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

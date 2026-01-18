import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast';
import BottomNavigation from "@/components/BottomNavigation";
import OnboardingModal from '@/components/OnboardingModal';
import NotificationBell from '@/components/NotificationBell';
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { SpeedInsights } from "@vercel/speed-insights/next"
import React from 'react';

export const metadata: Metadata = {
  title: 'VENUZ - Descubre la Noche',
  description: 'Los mejores lugares, eventos y experiencias cerca de ti',
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
  themeColor: '#0a0a0f',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-deep-black text-white font-body overflow-x-hidden scrollbar-casino">
        <AuthProvider>
          <PreferencesProvider>
            {/* Global Notification Bell - Fixed Position */}
            <div className="fixed top-4 right-4 z-[100]">
              <NotificationBell />
            </div>

            {/* Main content */}
            <main className="min-h-screen pb-24 md:pb-0 relative z-10">
              {children}
              <SpeedInsights />
            </main>

            {/* Bottom Navigation (mobile only) */}
            <BottomNavigation />

            {/* Toast notifications */}
            <Toaster position="top-center" reverseOrder={false} />
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

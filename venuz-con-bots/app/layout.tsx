import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VENUZ - El Ojo de Dios de la Fiesta',
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
  themeColor: '#FF1493',
}

import OnboardingModal from '@/components/OnboardingModal';
import { InstallPrompt } from '@/components/InstallPrompt';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="overflow-x-hidden">
        {/* Background effects */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-venuz-pink opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-venuz-red opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-venuz-gold opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow animation-delay-4000" />
        </div>

        <OnboardingModal />

        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* PWA Install Prompt */}
        <InstallPrompt />
      </body>
    </html>
  )
}


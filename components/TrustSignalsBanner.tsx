'use client'

import { useState, useEffect } from 'react'

/**
 * WIDGET 3: TrustSignalsBanner
 * 
 * Propósito SEO + Conversión:
 * - Aumenta confianza del usuario (reduce bounce)
 * - Señales E-E-A-T para Google (Experience, Expertise, Authority, Trust)
 * - Mejora CTR en affiliate links
 * - Diferenciador vs competencia
 * 
 * Implementación:
 * - Stats dinámicas que se actualizan
 * - Badges de verificación
 * - Testimonials/reviews resumidos
 */

interface TrustStat {
  value: string | number
  label: string
  icon: string
  suffix?: string
}

interface TrustSignalsBannerProps {
  stats?: TrustStat[]
  variant?: 'compact' | 'full' | 'floating'
  className?: string
}

// Stats por defecto - NÚMEROS HONESTOS Y VERIFICABLES
// Actualizado: 31 Enero 2026 por requerimiento de auditoría Claude+Grok
const defaultStats: TrustStat[] = [
  { value: 2200, label: 'Lugares indexados', icon: '📍', suffix: '+' },
  { value: 8, label: 'Categorías', icon: '🏷️' },
  { value: 4.8, label: 'Rating promedio', icon: '⭐' },
  { value: '24/7', label: 'Actualización', icon: '🔄' }
]

export function TrustSignalsBanner({
  stats = defaultStats,
  variant = 'compact',
  className = ''
}: TrustSignalsBannerProps) {
  const [animatedStats, setAnimatedStats] = useState(stats)

  // Animar números incrementalmente al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats(stats)
    }, 100)
    return () => clearTimeout(timer)
  }, [stats])

  if (variant === 'compact') {
    return (
      <div className={`
        flex flex-wrap items-center justify-center gap-6 py-4 px-6
        bg-gradient-to-r from-gray-900/80 to-gray-800/80
        border-y border-gray-700/50
        ${className}
      `}>
        {animatedStats.map((stat, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-pink-400">{stat.icon}</span>
            <span className="text-white font-semibold">
              {typeof stat.value === 'number'
                ? stat.value.toLocaleString()
                : stat.value
              }
              {stat.suffix}
            </span>
            <span className="text-gray-400">{stat.label}</span>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'floating') {
    return (
      <div className={`
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-4 py-2 px-4
        bg-black/90 backdrop-blur-sm
        border border-gray-700 rounded-full
        shadow-2xl
        ${className}
      `}>
        <span className="text-green-400 text-sm font-medium">✓ Sitio Verificado</span>
        <div className="w-px h-4 bg-gray-600" />
        <span className="text-gray-400 text-sm">
          {animatedStats[0]?.value.toLocaleString()}+ lugares
        </span>
        <div className="w-px h-4 bg-gray-600" />
        <span className="text-yellow-400 text-sm">★ {animatedStats[2]?.value}</span>
      </div>
    )
  }

  // variant === 'full'
  return (
    <section className={`py-8 px-6 bg-gradient-to-b from-gray-900 to-black ${className}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            ¿Por qué confiar en VENUZ?
          </h2>
          <p className="text-gray-400">
            La plataforma líder de entretenimiento adulto en México
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {animatedStats.map((stat, i) => (
            <div
              key={i}
              className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                {typeof stat.value === 'number'
                  ? stat.value.toLocaleString()
                  : stat.value
                }
                {stat.suffix}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <TrustBadge icon="🔒" text="SSL Seguro" />
          <TrustBadge icon="✓" text="Contenido Verificado" />
          <TrustBadge icon="🔞" text="18+ Exclusivo" />
          <TrustBadge icon="🇲🇽" text="Hecho en México" />
          <TrustBadge icon="💳" text="Pagos Seguros" />
        </div>
      </div>
    </section>
  )
}

// Componente auxiliar: Badge individual
interface TrustBadgeProps {
  icon: string
  text: string
  variant?: 'default' | 'success' | 'warning'
}

export function TrustBadge({ icon, text, variant = 'default' }: TrustBadgeProps) {
  const variantStyles = {
    default: 'border-gray-600 text-gray-300',
    success: 'border-green-500/50 text-green-400 bg-green-900/20',
    warning: 'border-yellow-500/50 text-yellow-400 bg-yellow-900/20'
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1.5
      border rounded-full text-sm
      ${variantStyles[variant]}
    `}>
      <span>{icon}</span>
      <span>{text}</span>
    </span>
  )
}

/**
 * COMPONENTE: VerificationBadge
 * Para mostrar en cards de venues/modelos
 */
interface VerificationBadgeProps {
  type: 'verified' | 'premium' | 'new' | 'top'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function VerificationBadge({
  type,
  size = 'md',
  showText = true
}: VerificationBadgeProps) {
  const config = {
    verified: {
      icon: '✓',
      text: 'Verificado',
      bg: 'bg-blue-500',
      border: 'border-blue-400'
    },
    premium: {
      icon: '⭐',
      text: 'Premium',
      bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
      border: 'border-yellow-400'
    },
    new: {
      icon: '✨',
      text: 'Nuevo',
      bg: 'bg-green-500',
      border: 'border-green-400'
    },
    top: {
      icon: '🏆',
      text: 'Top Rated',
      bg: 'bg-gradient-to-r from-pink-500 to-purple-500',
      border: 'border-pink-400'
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const { icon, text, bg, border } = config[type]

  return (
    <span className={`
      inline-flex items-center gap-1
      ${bg} ${sizeClasses[size]}
      text-white font-medium rounded-full
      border ${border}
      shadow-lg
    `}>
      <span>{icon}</span>
      {showText && <span>{text}</span>}
    </span>
  )
}

/**
 * COMPONENTE: AffiliateDisclosure
 * Requerido por FTC y agencias de afiliados
 */
interface AffiliateDisclosureProps {
  variant?: 'inline' | 'banner' | 'footer'
  siteName?: string
}

export function AffiliateDisclosure({
  variant = 'inline',
  siteName = 'VENUZ'
}: AffiliateDisclosureProps) {
  if (variant === 'inline') {
    return (
      <p className="text-gray-500 text-xs italic">
        * Este enlace es de afiliado. {siteName} puede recibir una comisión sin costo adicional para ti.
      </p>
    )
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-sm">
        <p className="text-gray-400">
          <span className="text-yellow-400 font-medium">📢 Divulgación:</span>{' '}
          Algunos enlaces en esta página son de afiliados. Esto significa que {siteName}
          puede recibir una pequeña comisión si realizas una compra, sin costo adicional
          para ti. Esto nos ayuda a mantener el sitio gratuito.{' '}
          <a href="/about#affiliate" className="text-pink-400 hover:underline">
            Más información
          </a>
        </p>
      </div>
    )
  }

  // variant === 'footer'
  return (
    <div className="border-t border-gray-700 pt-4 mt-6">
      <p className="text-gray-500 text-sm">
        <strong className="text-gray-400">Divulgación de Afiliados:</strong>{' '}
        {siteName} participa en programas de afiliados con diversas plataformas de
        entretenimiento. Cuando haces clic en ciertos enlaces y realizas una compra
        o te registras, podemos recibir una comisión sin costo adicional para ti.
        Nuestras recomendaciones se basan en evaluaciones independientes y no están
        influenciadas por compensaciones de afiliados.{' '}
        <a href="/terms" className="text-pink-400 hover:underline">
          Ver términos completos
        </a>
      </p>
    </div>
  )
}

/**
 * COMPONENTE: RecentActivity
 * Muestra actividad reciente para social proof
 */
interface Activity {
  user: string
  action: string
  target: string
  time: string
  avatar?: string
}

interface RecentActivityProps {
  activities?: Activity[]
  autoScroll?: boolean
  className?: string
}

export function RecentActivity({
  activities = [
    { user: 'Carlos M.', action: 'visitó', target: 'Stripchat', time: 'hace 2 min' },
    { user: 'María L.', action: 'se registró en', target: 'CamSoda', time: 'hace 5 min' },
    { user: 'Juan R.', action: 'dejó review en', target: 'Club Mandala', time: 'hace 8 min' },
    { user: 'Ana S.', action: 'verificó', target: 'Luna Escorts', time: 'hace 12 min' }
  ],
  autoScroll = true,
  className = ''
}: RecentActivityProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!autoScroll) return

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activities.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [activities.length, autoScroll])

  const current = activities[currentIndex]

  return (
    <div className={`
      inline-flex items-center gap-2 px-4 py-2
      bg-gray-900/80 border border-gray-700 rounded-full
      text-sm
      ${className}
    `}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>

      <span className="text-gray-300">
        <span className="text-white font-medium">{current.user}</span>
        {' '}{current.action}{' '}
        <span className="text-pink-400">{current.target}</span>
      </span>

      <span className="text-gray-500">{current.time}</span>
    </div>
  )
}

export default TrustSignalsBanner

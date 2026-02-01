'use client'

import { useState, useEffect } from 'react'

/**
 * WIDGET 1: LiveNowCounter
 * 
 * Propósito SEO: 
 * - Aumenta tiempo de permanencia (usuario ve actividad real)
 * - Social proof ("si hay 800 personas, debe ser bueno")
 * - Señal de confianza para Google (sitio activo)
 * 
 * Implementación:
 * - Número base + variación aleatoria para simular actividad
 * - Se puede conectar a analytics real vía WebSocket
 */

interface LiveNowCounterProps {
  baseCount?: number
  variance?: number
  showDot?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LiveNowCounter({
  baseCount = 847,
  variance = 50,
  showDot = true,
  size = 'md',
  className = ''
}: LiveNowCounterProps) {
  const [count, setCount] = useState(baseCount)
  const [isAnimating, setIsAnimating] = useState(false)

  // Simular fluctuación de usuarios online
  useEffect(() => {
    const interval = setInterval(() => {
      const change = Math.floor(Math.random() * 20) - 10 // -10 a +10
      setCount(prev => {
        const newCount = prev + change
        // Mantener dentro del rango
        return Math.max(baseCount - variance, Math.min(baseCount + variance, newCount))
      })
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }, 5000) // Actualiza cada 5 segundos

    return () => clearInterval(interval)
  }, [baseCount, variance])

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  return (
    <div 
      className={`
        inline-flex items-center gap-2 
        bg-gradient-to-r from-red-900/30 to-pink-900/30 
        border border-red-500/30 
        rounded-full 
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
      
      <span className={`
        font-semibold text-white 
        transition-transform duration-300
        ${isAnimating ? 'scale-110' : 'scale-100'}
      `}>
        {count.toLocaleString()}
      </span>
      
      <span className="text-gray-400">
        online ahora
      </span>
    </div>
  )
}

/**
 * VARIANTE: LiveNowCounterDetailed
 * Muestra breakdown por categoría
 */
interface CategoryCount {
  name: string
  count: number
  icon: string
}

interface LiveNowCounterDetailedProps {
  categories: CategoryCount[]
  className?: string
}

export function LiveNowCounterDetailed({
  categories = [
    { name: 'Webcams', count: 523, icon: '📹' },
    { name: 'Clubs', count: 187, icon: '🎉' },
    { name: 'Escorts', count: 94, icon: '💎' }
  ],
  className = ''
}: LiveNowCounterDetailedProps) {
  const [counts, setCounts] = useState(categories)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCounts(prev => prev.map(cat => ({
        ...cat,
        count: cat.count + Math.floor(Math.random() * 10) - 5
      })))
    }, 8000)
    
    return () => clearInterval(interval)
  }, [])

  const total = counts.reduce((acc, cat) => acc + cat.count, 0)

  return (
    <div className={`bg-gray-900/50 rounded-xl p-4 ${className}`}>
      {/* Header con total */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-white font-semibold">En Vivo Ahora</span>
        </div>
        <span className="text-2xl font-bold text-white">{total.toLocaleString()}</span>
      </div>
      
      {/* Breakdown por categoría */}
      <div className="space-y-2">
        {counts.map((cat, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {cat.icon} {cat.name}
            </span>
            <span className="text-white font-medium">
              {cat.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Default export
export default LiveNowCounter

'use client'

import { useState, useEffect } from 'react'

/**
 * WIDGET 2: TopRatedSidebar
 * 
 * Propósito SEO:
 * - Aumenta páginas por sesión (links internos)
 * - Reduce bounce rate (contenido adicional visible)
 * - Señal de engagement para Google
 * - Cross-selling de contenido
 * 
 * Implementación:
 * - Se actualiza periódicamente para simular "trending"
 * - Badges visuales para categorización
 * - Links internos para mejorar link juice
 */

interface TopRatedItem {
  id: string
  name: string
  category: string
  rating: number
  reviewCount: number
  imageUrl: string
  href: string
  badge?: 'trending' | 'new' | 'verified' | 'hot'
  isLive?: boolean
}

interface TopRatedSidebarProps {
  title?: string
  items: TopRatedItem[]
  maxItems?: number
  showRefreshTimer?: boolean
  className?: string
}

export function TopRatedSidebar({
  title = "🔥 Trending Ahora",
  items,
  maxItems = 5,
  showRefreshTimer = true,
  className = ''
}: TopRatedSidebarProps) {
  const [displayItems, setDisplayItems] = useState(items.slice(0, maxItems))
  const [refreshIn, setRefreshIn] = useState(60)

  // Countdown para próximo refresh
  useEffect(() => {
    if (!showRefreshTimer) return

    const timer = setInterval(() => {
      setRefreshIn(prev => {
        if (prev <= 1) {
          // Shuffle items para simular actualización
          setDisplayItems(prev => {
            const shuffled = [...items].sort(() => Math.random() - 0.5)
            return shuffled.slice(0, maxItems)
          })
          return 60
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [items, maxItems, showRefreshTimer])

  const getBadgeStyle = (badge?: string) => {
    switch (badge) {
      case 'trending':
        return 'bg-orange-500 text-white'
      case 'new':
        return 'bg-green-500 text-white'
      case 'verified':
        return 'bg-blue-500 text-white'
      case 'hot':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getBadgeText = (badge?: string) => {
    switch (badge) {
      case 'trending': return '📈 Trending'
      case 'new': return '✨ Nuevo'
      case 'verified': return '✓ Verificado'
      case 'hot': return '🔥 Hot'
      default: return ''
    }
  }

  return (
    <aside className={`bg-gray-900/80 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {showRefreshTimer && (
          <span className="text-xs text-gray-500">
            Actualiza en {refreshIn}s
          </span>
        )}
      </div>

      {/* Lista de items */}
      <div className="space-y-3">
        {displayItems.map((item, index) => (
          <a
            key={item.id}
            href={item.href}
            className="flex gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
          >
            {/* Ranking number */}
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {index + 1}
            </div>

            {/* Thumbnail */}
            <div className="relative flex-shrink-0">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              {item.isLive && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded">
                  LIVE
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm truncate group-hover:text-pink-400 transition-colors">
                  {item.name}
                </span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${getBadgeStyle(item.badge)}`}>
                    {getBadgeText(item.badge)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-gray-500 text-xs">{item.category}</span>
                <span className="text-yellow-400 text-xs">
                  ★ {item.rating.toFixed(1)}
                </span>
                <span className="text-gray-600 text-xs">
                  ({item.reviewCount})
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Ver más link */}
      <a
        href="/trending"
        className="block text-center text-pink-400 hover:text-pink-300 text-sm mt-4 py-2 border-t border-gray-800"
      >
        Ver todo el ranking →
      </a>
    </aside>
  )
}

/**
 * VARIANTE: TopRatedTabs
 * Con tabs para diferentes categorías
 */
interface TopRatedTabsProps {
  tabs: {
    id: string
    label: string
    icon: string
    items: TopRatedItem[]
  }[]
  className?: string
}

export function TopRatedTabs({ tabs, className = '' }: TopRatedTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')

  const activeItems = tabs.find(t => t.id === activeTab)?.items || []

  return (
    <aside className={`bg-gray-900/80 rounded-xl overflow-hidden ${className}`}>
      {/* Tabs header */}
      <div className="flex border-b border-gray-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 px-3 py-3 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'text-pink-400 border-b-2 border-pink-400 bg-pink-400/5'
                : 'text-gray-400 hover:text-white'
              }
            `}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-2">
          {activeItems.slice(0, 5).map((item, index) => (
            <a
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <span className="text-gray-500 text-sm w-4">{index + 1}.</span>
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-10 h-10 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm truncate block">{item.name}</span>
                <span className="text-yellow-400 text-xs">★ {item.rating}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}

// Datos de ejemplo
export const exampleTopRatedItems: TopRatedItem[] = [
  {
    id: '1',
    name: 'Club Mandala PV',
    category: 'Club Nocturno',
    rating: 4.8,
    reviewCount: 324,
    imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=200&h=200&auto=format&fit=crop',
    href: '/nightlife/puerto-vallarta/clubs/mandala',
    badge: 'trending',
    isLive: true
  },
  {
    id: '2',
    name: 'Stripchat',
    category: 'Webcams',
    rating: 4.7,
    reviewCount: 15420,
    imageUrl: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?q=80&w=200&h=200&auto=format&fit=crop',
    href: '/webcams/reviews/stripchat',
    badge: 'verified'
  },
  {
    id: '3',
    name: 'Luna VIP PV',
    category: 'Estoy Soltero',
    rating: 4.9,
    reviewCount: 87,
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&auto=format&fit=crop',
    href: '/soltero/puerto-vallarta/luna-vip',
    badge: 'hot'
  },
  {
    id: '4',
    name: 'CamSoda',
    category: 'Webcams',
    rating: 4.6,
    reviewCount: 12847,
    imageUrl: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=200&h=200&auto=format&fit=crop',
    href: '/webcams/reviews/camsoda',
    badge: 'new'
  },
  {
    id: '5',
    name: 'La Santa PV',
    category: 'Bar',
    rating: 4.5,
    reviewCount: 156,
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=200&h=200&auto=format&fit=crop',
    href: '/nightlife/puerto-vallarta/bars/la-santa'
  }
]


export default TopRatedSidebar

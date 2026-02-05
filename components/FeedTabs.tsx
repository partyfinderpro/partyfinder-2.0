'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Wine, Flame, Grid3X3 } from 'lucide-react'

/**
 * VENUZ - FeedTabs Component
 * 
 * Separa el contenido entre Nightlife y Adult para evitar
 * que cervecerías aparezcan junto a webcams.
 * 
 * Requerido por auditoría Claude+Grok - 31 Enero 2026
 */

export type FeedMode = 'all' | 'nightlife' | 'adult'

interface FeedTabsProps {
    initialMode?: FeedMode
    onModeChange: (mode: FeedMode) => void
    className?: string
}

const tabs = [
    {
        id: 'all' as FeedMode,
        label: 'Todo',
        icon: Grid3X3,
        color: 'pink'
    },
    {
        id: 'nightlife' as FeedMode,
        label: 'Vida Nocturna',
        icon: Wine,
        color: 'purple',
        description: 'Bares, Clubs, Restaurantes, Beach Clubs'
    },
    {
        id: 'adult' as FeedMode,
        label: 'Adultos',
        icon: Flame,
        color: 'red',
        description: 'Webcams, Escorts, Table Dance'
    }
]

export function FeedTabs({ initialMode = 'all', onModeChange, className = '' }: FeedTabsProps) {
    const [mode, setMode] = useState<FeedMode>(initialMode)

    const handleChange = (newMode: FeedMode) => {
        setMode(newMode)
        onModeChange(newMode)
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {tabs.map((tab) => {
                const isActive = mode === tab.id
                const Icon = tab.icon

                return (
                    <button
                        key={tab.id}
                        onClick={() => handleChange(tab.id)}
                        className={`
              relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-300
              ${isActive
                                ? 'bg-venuz-pink text-white shadow-lg shadow-venuz-pink/30'
                                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                            }
            `}
                    >
                        <Icon size={16} />
                        <span>{tab.label}</span>

                        {/* Active indicator */}
                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-venuz-pink rounded-full -z-10"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                )
            })}
        </div>
    )
}

// Categorías por modo (Sincronizado con DB Venuz)
export const NIGHTLIFE_CATEGORIES = [
    'bar',
    'bares',
    'club',
    'clubs',
    'restaurant',
    'restaurante',
    'restaurantes',
    'beach_club',
    'beach club',
    'beach clubs',
    'beach',
    'social media',
    'social_media',
    'Social Media',
    'event',
    'evento',
    'eventos',
    'concert',
    'concierto',
    'conciertos',
    'party',
    'fiesta',
    'fiestas',
    'lounge',
    'rooftop',
    'brewery',
    'cerveceria',
    'cervecería',
    'cantina',
    'pub',
    'sports bar',
    'karaoke',
]

export const ADULT_CATEGORIES = [
    'webcam',
    'webcams',
    'cam',
    'cams',
    'escort',
    'escorts',
    'soltero',
    'massage',
    'masaje',
    'masajes',
    'table_dance',
    'table dance',
    'strip',
    'strip club',
    'stripclub',
    'adult',
    'hookup',
    'hookups',
    'dating',
    'ai-porn',
    'free-tubes',
    'live-cams',
    'premium',
]

/**
 * Filtra items del feed según el modo seleccionado
 */
export function filterByMode<T extends { category?: string }>(items: T[], mode: FeedMode): T[] {
    if (mode === 'all') return items

    if (mode === 'nightlife') {
        return items.filter(item => {
            const cat = (item.category || '').toLowerCase()
            return NIGHTLIFE_CATEGORIES.some(nc => cat.includes(nc.toLowerCase()))
        })
    }

    if (mode === 'adult') {
        return items.filter(item => {
            const cat = (item.category || '').toLowerCase()
            return ADULT_CATEGORIES.some(ac => cat.includes(ac.toLowerCase()))
        })
    }

    return items
}

export default FeedTabs

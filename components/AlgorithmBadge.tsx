'use client'

import { motion } from 'framer-motion'
import { Sparkles, Brain, Zap, TrendingUp } from 'lucide-react'

/**
 * VENUZ - AlgorithmBadge Component
 * 
 * Muestra al usuario que el Highway Algorithm está personalizando su feed.
 * Crea transparencia y confianza en la tecnología.
 * 
 * Requerido por auditoría Claude+Grok - 31 Enero 2026
 */

type IntentLevel = 'cold' | 'warm' | 'hot'

interface AlgorithmBadgeProps {
    isActive: boolean
    intentScore: number
    variant?: string | null
    className?: string
}

const intentConfig = {
    cold: {
        label: 'Explorando',
        icon: Sparkles,
        color: 'blue',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/30'
    },
    warm: {
        label: 'Personalizado',
        icon: TrendingUp,
        color: 'yellow',
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-500/30'
    },
    hot: {
        label: 'Para ti',
        icon: Zap,
        color: 'pink',
        bgColor: 'bg-venuz-pink/10',
        textColor: 'text-venuz-pink',
        borderColor: 'border-venuz-pink/30'
    }
}

function getIntentLevel(score: number): IntentLevel {
    if (score < 0.35) return 'cold'
    if (score < 0.65) return 'warm'
    return 'hot'
}

export function AlgorithmBadge({
    isActive,
    intentScore,
    variant,
    className = ''
}: AlgorithmBadgeProps) {
    if (!isActive) return null

    const intentLevel = getIntentLevel(intentScore)
    const config = intentConfig[intentLevel]
    const Icon = config.icon

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
        ${config.bgColor} ${config.textColor} border ${config.borderColor}
        ${className}
      `}
        >
            <Icon size={12} className="animate-pulse" />
            <span>Feed: {config.label}</span>
            <span className="opacity-60">•</span>
            <span className="flex items-center gap-1 opacity-70">
                <Brain size={10} />
                Highway v2.0
            </span>
        </motion.div>
    )
}

/**
 * Versión compacta para el header
 */
export function AlgorithmBadgeCompact({
    isActive,
    intentScore
}: {
    isActive: boolean
    intentScore: number
}) {
    if (!isActive) return null

    const intentLevel = getIntentLevel(intentScore)
    const config = intentConfig[intentLevel]
    const Icon = config.icon

    return (
        <div className={`
      flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px]
      ${config.bgColor} ${config.textColor}
    `}>
            <Icon size={10} />
            <span className="hidden sm:inline">{config.label}</span>
            <span className="sm:hidden">AI</span>
        </div>
    )
}

/**
 * Tooltip explicativo para usuarios curiosos
 */
export function AlgorithmExplainer() {
    return (
        <div className="bg-gray-900 border border-white/10 rounded-xl p-4 max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <Brain className="text-venuz-pink" size={20} />
                <h4 className="font-bold text-white">Highway Algorithm™</h4>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-3">
                Nuestro algoritmo de IA analiza tu comportamiento para mostrarte
                contenido cada vez más relevante. Entre más usas VENUZ, mejor te conocemos.
            </p>
            <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-blue-400" />
                    <span className="text-gray-400">Explorando = Estás descubriendo</span>
                </div>
                <div className="flex items-center gap-2">
                    <TrendingUp size={12} className="text-yellow-400" />
                    <span className="text-gray-400">Personalizado = Aprendiendo de ti</span>
                </div>
                <div className="flex items-center gap-2">
                    <Zap size={12} className="text-venuz-pink" />
                    <span className="text-gray-400">Para ti = Feed ultra-personalizado</span>
                </div>
            </div>
        </div>
    )
}

export default AlgorithmBadge

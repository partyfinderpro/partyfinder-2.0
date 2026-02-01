'use client'

import { useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * VENUZ Age Gate Component
 * 
 * Verificación de edad obligatoria para adult content.
 * Requerido por auditoría Claude+Grok - 31 Enero 2026
 */

interface AgeGateProps {
    children: ReactNode
}

export function AgeGate({ children }: AgeGateProps) {
    const [verified, setVerified] = useState<boolean | null>(null)
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        // Check if already verified in localStorage
        const stored = localStorage.getItem('venuz_age_verified')
        const storedTimestamp = localStorage.getItem('venuz_age_verified_at')

        // Require re-verification after 30 days
        if (stored === 'true' && storedTimestamp) {
            const verifiedDate = new Date(storedTimestamp)
            const now = new Date()
            const daysDiff = (now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24)

            if (daysDiff < 30) {
                setVerified(true)
            } else {
                setVerified(false)
            }
        } else {
            setVerified(false)
        }
    }, [])

    const handleVerify = () => {
        setIsExiting(true)
        localStorage.setItem('venuz_age_verified', 'true')
        localStorage.setItem('venuz_age_verified_at', new Date().toISOString())

        // Small delay for exit animation
        setTimeout(() => {
            setVerified(true)
        }, 400)
    }

    const handleDeny = () => {
        // Redirect to Google (industry standard)
        window.location.href = 'https://www.google.com'
    }

    // Loading state - show nothing while checking
    if (verified === null) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-pulse text-venuz-pink text-2xl font-bold">VENUZ</div>
            </div>
        )
    }

    // Not verified - show gate
    if (!verified) {
        return (
            <AnimatePresence>
                {!isExiting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            transition={{ type: "spring", damping: 20 }}
                            className="max-w-md w-full bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl p-8 text-center shadow-2xl"
                        >
                            {/* Logo */}
                            <div className="text-5xl mb-6">🔞</div>

                            {/* Title */}
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Contenido para Adultos
                            </h1>
                            <p className="text-venuz-pink font-medium mb-6">VENUZ</p>

                            {/* Description */}
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Este sitio contiene material para adultos incluyendo contenido sexual explícito.
                                Al ingresar, confirmas que:
                            </p>

                            <ul className="text-left text-gray-300 text-sm space-y-2 mb-8 px-4">
                                <li className="flex items-start gap-2">
                                    <span className="text-venuz-pink">✓</span>
                                    <span>Tienes <strong>18 años de edad o más</strong> (o la edad de mayoría en tu ubicación)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-venuz-pink">✓</span>
                                    <span>Es <strong>legal ver contenido adulto</strong> en tu jurisdicción</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-venuz-pink">✓</span>
                                    <span>Aceptas nuestros <a href="/terms" className="text-venuz-pink hover:underline">Términos de Servicio</a></span>
                                </li>
                            </ul>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={handleVerify}
                                    className="venuz-button text-lg px-8 py-4"
                                >
                                    Soy mayor de 18 años
                                </button>
                                <button
                                    onClick={handleDeny}
                                    className="venuz-button-secondary px-8 py-4 text-gray-400 hover:text-white"
                                >
                                    Salir
                                </button>
                            </div>

                            {/* Legal Footer */}
                            <p className="text-xs text-gray-600 mt-8 leading-relaxed">
                                Al hacer clic en "Soy mayor de 18", aceptas nuestros{' '}
                                <a href="/terms" className="text-gray-500 hover:underline">Términos</a>,{' '}
                                <a href="/privacy" className="text-gray-500 hover:underline">Privacidad</a> y{' '}
                                <a href="/2257" className="text-gray-500 hover:underline">2257 Compliance</a>.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        )
    }

    // Verified - show content
    return <>{children}</>
}

export default AgeGate

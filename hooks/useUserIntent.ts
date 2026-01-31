'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    getUserIntent,
    createUserIntent,
    updateUserIntentOnInteraction,
    calculatePillarWeights,
    type UserIntent,
    type ContentPillar,
} from '@/lib/highwayAlgorithm';
import {
    initializeOrUpdateSession,
    applyTieredDecay,
    applyPartialReset,
    initVisibilityHandler,
    type SessionData,
} from '@/lib/sessionUtils';

// ============================================
// VENUZ - Hook para User Intent (Highway Algorithm)
// Versión 2.0 con sugerencias de Grok:
// - Tiered decay por inactividad
// - First/Last referrer dual tracking
// - Visibility change handler
// - Partial reset on return
// ============================================

interface UseUserIntentReturn {
    intent: UserIntent | null;
    intentScore: number;
    weights: { wJob: number; wEvent: number; wAdult: number };
    isLoading: boolean;
    error: string | null;
    session: SessionData | null;

    // Actions
    recordView: (contentId: string, pillar: ContentPillar) => Promise<void>;
    recordLike: (contentId: string, pillar: ContentPillar) => Promise<void>;
    initializeFromReferrer: (referrer: string) => Promise<void>;
}

/**
 * Hook para manejar el User Intent en el Highway Algorithm (v2.0)
 * 
 * Mejoras de Grok incluidas:
 * - Tiered decay: 0-5min (0.995), 5-15min (0.97), 15-30min (0.90)
 * - Dual referrer tracking (first + last)
 * - Visibility change para pausar/reanudar decay
 * - Partial reset al volver (70% del boost máximo)
 */
export function useUserIntent(): UseUserIntentReturn {
    const [intent, setIntent] = useState<UserIntent | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ref para el cleanup del visibility handler
    const visibilityCleanupRef = useRef<(() => void) | null>(null);

    // Obtener userId (anónimo desde localStorage o autenticado)
    const getUserId = useCallback(() => {
        if (typeof window === 'undefined') return null;

        let userId = localStorage.getItem('venuz_user_id');

        if (!userId) {
            // Generar ID anónimo
            userId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('venuz_user_id', userId);
        }

        return userId;
    }, []);

    // Cargar intent y sesión al montar
    useEffect(() => {
        const loadIntent = async () => {
            const userId = getUserId();
            if (!userId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // 1. Inicializar o actualizar sesión (con decay automático)
                const currentSession = initializeOrUpdateSession(userId);
                setSession(currentSession);

                // 2. Obtener intent de Supabase
                let userIntent = await getUserIntent(userId);

                if (!userIntent) {
                    // Crear nuevo intent usando datos de sesión
                    userIntent = await createUserIntent(
                        userId,
                        currentSession.lastReferrer,
                        currentSession.country ? undefined : undefined // TODO: location
                    );
                } else if (currentSession.isNewSession) {
                    // Sesión nueva pero intent existente: aplicar decay
                    const inactiveMinutes = (Date.now() - new Date(userIntent.lastUpdated).getTime()) / 60000;
                    const decayedScore = applyTieredDecay(
                        userIntent.intentScore,
                        inactiveMinutes,
                        currentSession.utm.medium
                    );

                    // Si decayó significativamente, aplicar partial reset
                    if (decayedScore < userIntent.intentScore * 0.8) {
                        console.log(`[Highway] 📉 Decay applied: ${(userIntent.intentScore * 100).toFixed(0)}% → ${(decayedScore * 100).toFixed(0)}%`);
                    }

                    userIntent = { ...userIntent, intentScore: decayedScore };
                }

                setIntent(userIntent);

            } catch (err) {
                console.error('[useUserIntent] Error:', err);
                setError('Error loading user intent');
            } finally {
                setIsLoading(false);
            }
        };

        loadIntent();
    }, [getUserId]);

    // Inicializar visibility handler
    useEffect(() => {
        const userId = getUserId();
        if (!userId || !intent) return;

        // Cleanup anterior si existe
        if (visibilityCleanupRef.current) {
            visibilityCleanupRef.current();
        }

        visibilityCleanupRef.current = initVisibilityHandler(
            // onHide: guardar timestamp
            () => {
                console.log('[Highway] 👁️ Tab hidden, pausing decay...');
            },
            // onShow: aplicar decay por tiempo inactivo
            async (inactiveMs: number) => {
                const inactiveMinutes = inactiveMs / 60000;
                console.log(`[Highway] 👁️ Tab visible after ${inactiveMinutes.toFixed(1)} minutes`);

                if (inactiveMinutes > 5) {
                    // Aplicar decay
                    const newScore = applyTieredDecay(
                        intent.intentScore,
                        inactiveMinutes,
                        session?.utm.medium
                    );

                    // Aplicar partial reset si hay actividad
                    const finalScore = applyPartialReset(newScore, 0.1);

                    setIntent(prev => prev ? {
                        ...prev,
                        intentScore: finalScore,
                        lastUpdated: new Date().toISOString(),
                    } : null);

                    console.log(`[Highway] 📉 Visibility decay: ${(intent.intentScore * 100).toFixed(0)}% → ${(finalScore * 100).toFixed(0)}%`);
                }
            }
        );

        // Cleanup on unmount
        return () => {
            if (visibilityCleanupRef.current) {
                visibilityCleanupRef.current();
                visibilityCleanupRef.current = null;
            }
        };
    }, [getUserId, intent?.intentScore, session?.utm.medium]);

    // Calcular score e weights actuales
    const intentScore = intent?.intentScore ?? 0.5;
    const weights = calculatePillarWeights(intentScore);

    // Registrar vista de contenido
    const recordView = useCallback(async (contentId: string, pillar: ContentPillar) => {
        const userId = getUserId();
        if (!userId) return;

        try {
            const newScore = await updateUserIntentOnInteraction(userId, 'view', pillar);

            setIntent(prev => prev ? {
                ...prev,
                intentScore: newScore,
                totalViews: prev.totalViews + 1,
                lastUpdated: new Date().toISOString(),
            } : null);

            // Actualizar sesión
            setSession(prev => prev ? {
                ...prev,
                intentScore: newScore,
                lastActiveTs: Date.now(),
            } : null);

        } catch (err) {
            console.error('[useUserIntent] Error recording view:', err);
        }
    }, [getUserId]);

    // Registrar like de contenido
    const recordLike = useCallback(async (contentId: string, pillar: ContentPillar) => {
        const userId = getUserId();
        if (!userId) return;

        try {
            const newScore = await updateUserIntentOnInteraction(userId, 'like', pillar);

            setIntent(prev => {
                if (!prev) return null;

                const updates: Partial<UserIntent> = {
                    intentScore: newScore,
                    lastUpdated: new Date().toISOString(),
                };

                // Incrementar contador del pilar correspondiente
                switch (pillar) {
                    case 'job':
                        updates.likesJob = prev.likesJob + 1;
                        break;
                    case 'event':
                        updates.likesEvent = prev.likesEvent + 1;
                        break;
                    case 'adult':
                        updates.likesAdult = prev.likesAdult + 1;
                        break;
                }

                return { ...prev, ...updates };
            });

            // Actualizar sesión
            setSession(prev => prev ? {
                ...prev,
                intentScore: newScore,
                lastActiveTs: Date.now(),
            } : null);

            // Log para debugging
            console.log(`[Highway] 🎯 Like on ${pillar} → New Intent: ${(newScore * 100).toFixed(0)}%`);

            // Notificar si llegamos al tercer like de evento
            if (pillar === 'event' && intent?.likesEvent === 2) {
                console.log('[Highway] 🔥 Third Event Like! Adult content unlocked!');
            }
        } catch (err) {
            console.error('[useUserIntent] Error recording like:', err);
        }
    }, [getUserId, intent?.likesEvent]);

    // Inicializar desde referrer (para cuando llega tráfico de ads)
    const initializeFromReferrer = useCallback(async (referrer: string) => {
        const userId = getUserId();
        if (!userId) return;

        try {
            // Re-crear intent con nuevo referrer
            const newIntent = await createUserIntent(userId, referrer);
            setIntent(newIntent);

            console.log(`[Highway] 📍 Initialized from referrer: ${referrer} → Intent: ${newIntent.intentScore}`);
        } catch (err) {
            console.error('[useUserIntent] Error initializing from referrer:', err);
        }
    }, [getUserId]);

    return {
        intent,
        intentScore,
        weights,
        isLoading,
        error,
        session,
        recordView,
        recordLike,
        initializeFromReferrer,
    };
}

// ============================================
// Hook para obtener solo los weights (sin tracking)
// ============================================

export function usePillarWeights(intentScore: number = 0.5) {
    return calculatePillarWeights(intentScore);
}

// ============================================
// Utilidad para debugging
// ============================================

export function useIntentDebug() {
    const { intent, weights, session } = useUserIntent();

    useEffect(() => {
        if (intent) {
            console.table({
                '🎯 Intent Score': `${(intent.intentScore * 100).toFixed(0)}%`,
                '💼 Job Weight': `${(weights.wJob * 100).toFixed(0)}%`,
                '🎉 Event Weight': `${(weights.wEvent * 100).toFixed(0)}%`,
                '🔥 Adult Weight': `${(weights.wAdult * 100).toFixed(0)}%`,
                'Likes Job': intent.likesJob,
                'Likes Event': intent.likesEvent,
                'Likes Adult': intent.likesAdult,
                '📍 First Referrer': session?.firstReferrer || 'N/A',
                '📍 Last Referrer': session?.lastReferrer || 'N/A',
                '⏱️ Session': session?.isNewSession ? 'NEW' : 'Returning',
            });
        }
    }, [intent, weights, session]);
}

export default useUserIntent;

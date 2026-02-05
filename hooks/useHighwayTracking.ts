'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface TrackingData {
    itemId: string;
    categorySlug: string;
    isPremium?: boolean;
}

/**
 * Hook de Tracking Avanzado (Highway v4)
 * Mide tiempo real de visualización y engagement profundo
 */
export function useHighwayTracking({ itemId, categorySlug, isPremium }: TrackingData) {
    const [startTime, setStartTime] = useState<number | null>(null);
    const [secondsSpent, setSecondsSpent] = useState(0);
    const [hasClicked, setHasClicked] = useState(false);
    const [hasShared, setHasShared] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [completionPct, setCompletionPct] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Contexto de sesión
    const getSessionId = useCallback(() => {
        if (typeof window === 'undefined') return 'root';
        let sid = sessionStorage.getItem('venuz_session_id');
        if (!sid) {
            sid = `sess_${Date.now()}`;
            sessionStorage.setItem('venuz_session_id', sid);
        }
        return sid;
    }, []);

    const getDeviceId = useCallback(() => {
        if (typeof window === 'undefined') return 'anonymous';
        return localStorage.getItem('venuz_user_id') || 'unknown';
    }, []);

    // Enviar datos al servidor
    const flushEngagement = useCallback(async (finalTime = 0) => {
        const time = finalTime || secondsSpent;
        if (time < 1) return; // No trackear parpadeos

        try {
            await fetch('/api/feed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: getDeviceId(),
                    itemId,
                    categorySlug,
                    sessionId: getSessionId(),
                    timeSpent: time,
                    completionPct,
                    clicked: hasClicked,
                    saved: hasSaved,
                    shared: hasShared,
                    userId: localStorage.getItem('venuz_user_id')
                })
            });
        } catch (err) {
            console.warn('[Highway Tracking] Failed to flush engagement:', err);
        }
    }, [itemId, categorySlug, secondsSpent, completionPct, hasClicked, hasSaved, hasShared, getDeviceId, getSessionId]);

    // Iniciar cronómetro cuando el componente es visible/activo
    const startTracking = useCallback(() => {
        if (startTime) return;
        setStartTime(Date.now());

        timerRef.current = setInterval(() => {
            setSecondsSpent(prev => prev + 1);
        }, 1000);
    }, [startTime]);

    // Parar y enviar
    const stopTracking = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (startTime) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            flushEngagement(elapsed);
            setStartTime(null);
        }
    }, [startTime, flushEngagement]);

    // Tracking de acciones específicas
    const trackClick = () => {
        setHasClicked(true);
        // Flush inmediato para clicks
        flushEngagement();
    };

    const trackShare = () => setHasShared(true);
    const trackSave = () => setHasSaved(true);
    const updateCompletion = (pct: number) => setCompletionPct(prev => Math.max(prev, pct));

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return {
        secondsSpent,
        startTracking,
        stopTracking,
        trackClick,
        trackShare,
        trackSave,
        updateCompletion
    };
}

'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================
// VENUZ PROGRESSIVE UX SYSTEM
// ============================================
// Controla el timing de toda la experiencia
// Hook → Engage → Capture → Monetize
// ============================================

interface UXStage {
    stage: 'hook' | 'engage' | 'capture' | 'monetize';
    timeOnSite: number;
    interactions: number;
    canShowGeoPrompt: boolean;
    canShowInstallPrompt: boolean;
    canShowPremiumPrompt: boolean;
    isTrialActive: boolean;
    trialEndsAt: number | null;
}

interface ProgressiveUXConfig {
    geoPromptDelay: number;
    installPromptDelay: number;
    premiumPromptDelay: number;
    trialDurationHours: number;
    maxFreeInteractions: number;
}

const DEFAULT_CONFIG: ProgressiveUXConfig = {
    geoPromptDelay: 120,        // 2 minutos
    installPromptDelay: 300,    // 5 minutos  
    premiumPromptDelay: 600,    // 10 minutos
    trialDurationHours: 48,     // 48 horas de trial
    maxFreeInteractions: 50,    // 50 interacciones gratis
};

const STORAGE_KEYS = {
    FIRST_VISIT: 'venuz_first_visit',
    INTERACTIONS: 'venuz_interactions',
    GEO_PROMPTED: 'venuz_geo_prompted',
    INSTALL_PROMPTED: 'venuz_install_prompted',
    PREMIUM_PROMPTED: 'venuz_premium_prompted',
    SESSION_START: 'venuz_session_start',
};

export function useProgressiveUX(config: Partial<ProgressiveUXConfig> = {}) {
    const settings = { ...DEFAULT_CONFIG, ...config };

    const [stage, setStage] = useState<UXStage>({
        stage: 'hook',
        timeOnSite: 0,
        interactions: 0,
        canShowGeoPrompt: false,
        canShowInstallPrompt: false,
        canShowPremiumPrompt: false,
        isTrialActive: true,
        trialEndsAt: null,
    });

    // Inicializar al montar
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const firstVisit = localStorage.getItem(STORAGE_KEYS.FIRST_VISIT);
        if (!firstVisit) {
            localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, Date.now().toString());
        }

        sessionStorage.setItem(STORAGE_KEYS.SESSION_START, Date.now().toString());

        const interactions = parseInt(localStorage.getItem(STORAGE_KEYS.INTERACTIONS) || '0');

        const firstVisitTime = parseInt(firstVisit || Date.now().toString());
        const trialEndsAt = firstVisitTime + (settings.trialDurationHours * 60 * 60 * 1000);
        const isTrialActive = Date.now() < trialEndsAt && interactions < settings.maxFreeInteractions;

        setStage(prev => ({
            ...prev,
            interactions,
            isTrialActive,
            trialEndsAt,
        }));
    }, [settings.trialDurationHours, settings.maxFreeInteractions]);

    // Timer para tracking de tiempo en sitio
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const interval = setInterval(() => {
            const sessionStart = parseInt(sessionStorage.getItem(STORAGE_KEYS.SESSION_START) || Date.now().toString());
            const timeOnSite = Math.floor((Date.now() - sessionStart) / 1000);

            const geoPrompted = localStorage.getItem(STORAGE_KEYS.GEO_PROMPTED) === 'true';
            const installPrompted = localStorage.getItem(STORAGE_KEYS.INSTALL_PROMPTED) === 'true';
            const premiumPrompted = sessionStorage.getItem(STORAGE_KEYS.PREMIUM_PROMPTED) === 'true';

            const canShowGeoPrompt = timeOnSite >= settings.geoPromptDelay && !geoPrompted;
            const canShowInstallPrompt = timeOnSite >= settings.installPromptDelay && !installPrompted;
            const canShowPremiumPrompt = timeOnSite >= settings.premiumPromptDelay && !premiumPrompted;

            let currentStage: UXStage['stage'] = 'hook';
            if (timeOnSite >= settings.premiumPromptDelay) {
                currentStage = 'monetize';
            } else if (timeOnSite >= settings.installPromptDelay) {
                currentStage = 'capture';
            } else if (timeOnSite >= settings.geoPromptDelay) {
                currentStage = 'engage';
            }

            setStage(prev => ({
                ...prev,
                timeOnSite,
                stage: currentStage,
                canShowGeoPrompt,
                canShowInstallPrompt,
                canShowPremiumPrompt,
            }));
        }, 1000);

        return () => clearInterval(interval);
    }, [settings]);

    const trackInteraction = useCallback(() => {
        if (typeof window === 'undefined') return;

        const current = parseInt(localStorage.getItem(STORAGE_KEYS.INTERACTIONS) || '0');
        const newCount = current + 1;
        localStorage.setItem(STORAGE_KEYS.INTERACTIONS, newCount.toString());

        setStage(prev => {
            const isTrialActive = prev.trialEndsAt
                ? Date.now() < prev.trialEndsAt && newCount < settings.maxFreeInteractions
                : true;

            return {
                ...prev,
                interactions: newCount,
                isTrialActive,
            };
        });
    }, [settings.maxFreeInteractions]);

    const markGeoPrompted = useCallback(() => {
        localStorage.setItem(STORAGE_KEYS.GEO_PROMPTED, 'true');
        setStage(prev => ({ ...prev, canShowGeoPrompt: false }));
    }, []);

    const markInstallPrompted = useCallback(() => {
        localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPTED, 'true');
        setStage(prev => ({ ...prev, canShowInstallPrompt: false }));
    }, []);

    const markPremiumPrompted = useCallback(() => {
        sessionStorage.setItem(STORAGE_KEYS.PREMIUM_PROMPTED, 'true');
        setStage(prev => ({ ...prev, canShowPremiumPrompt: false }));
    }, []);

    const resetUX = useCallback(() => {
        if (typeof window === 'undefined') return;

        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        window.location.reload();
    }, []);

    return {
        ...stage,
        trackInteraction,
        markGeoPrompted,
        markInstallPrompted,
        markPremiumPrompted,
        resetUX,
        config: settings,
    };
}

export default useProgressiveUX;

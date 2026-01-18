'use client';

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useProgressiveUX } from '../hooks/useProgressiveUX';
import { useSmartGeolocation } from '../hooks/useSmartGeolocation';
import { useUserBehavior } from '../hooks/useUserBehavior';
import SmartPrompts from './SmartPrompts';

interface VenuzUXContextType {
    // Progressive UX
    stage: 'hook' | 'engage' | 'capture' | 'monetize';
    timeOnSite: number;
    isTrialActive: boolean;
    interactions: number;
    trackInteraction: () => void;

    // Geolocation
    coordinates: { latitude: number; longitude: number; accuracy: 'ip' | 'gps' } | null;
    hasGPSPermission: boolean;
    getDistanceKm: (lat: number, lng: number) => number | null;
    formatDistance: (lat: number, lng: number) => string;

    // User Behavior
    topCategory: string | null;
    isReturningUser: boolean;
    visitCount: number;
    sessionViews: number;
    trackView: (itemId: string, category: string) => void;
    trackLike: (itemId: string, category: string) => void;
    trackSave: (itemId: string, category: string) => void;
    trackContact: (itemId: string, category: string) => void;
    getRecommendedCategories: () => string[];
    hasLiked: (itemId: string) => boolean;
    hasSaved: (itemId: string) => boolean;
    getEngagementScore: () => number;

    // Premium
    canUseFeature: (feature: 'distance' | 'favorites' | 'contact' | 'available_now') => boolean;
}

const VenuzUXContext = createContext<VenuzUXContextType | null>(null);

interface VenuzUXProviderProps {
    children: ReactNode;
    config?: {
        geoPromptDelay?: number;
        installPromptDelay?: number;
        premiumPromptDelay?: number;
        trialDurationHours?: number;
        maxFreeInteractions?: number;
    };
    onPremiumClick?: () => void;
    onInstallClick?: () => void;
}

export function VenuzUXProvider({
    children,
    config,
    onPremiumClick,
    onInstallClick,
}: VenuzUXProviderProps) {
    const progressiveUX = useProgressiveUX(config);
    const geolocation = useSmartGeolocation();
    const behavior = useUserBehavior();

    const handleGeoAccept = useCallback(async () => {
        progressiveUX.markGeoPrompted();
        const success = await geolocation.requestGPSPermission();
        return success;
    }, [progressiveUX, geolocation]);

    const handleGeoDecline = useCallback(() => {
        progressiveUX.markGeoPrompted();
    }, [progressiveUX]);

    const handleInstallAccept = useCallback(() => {
        progressiveUX.markInstallPrompted();

        if (typeof window !== 'undefined' && (window as any).deferredPrompt) {
            (window as any).deferredPrompt.prompt();
        }

        onInstallClick?.();
    }, [progressiveUX, onInstallClick]);

    const handleInstallDecline = useCallback(() => {
        progressiveUX.markInstallPrompted();
    }, [progressiveUX]);

    const handlePremiumAccept = useCallback(() => {
        progressiveUX.markPremiumPrompted();
        onPremiumClick?.();
    }, [progressiveUX, onPremiumClick]);

    const handlePremiumDecline = useCallback(() => {
        progressiveUX.markPremiumPrompted();
    }, [progressiveUX]);

    const canUseFeature = useCallback((feature: 'distance' | 'favorites' | 'contact' | 'available_now') => {
        if (progressiveUX.isTrialActive) return true;
        // TODO: Verificar suscripción premium real
        return false;
    }, [progressiveUX.isTrialActive]);

    const contextValue: VenuzUXContextType = {
        stage: progressiveUX.stage,
        timeOnSite: progressiveUX.timeOnSite,
        isTrialActive: progressiveUX.isTrialActive,
        interactions: progressiveUX.interactions,
        trackInteraction: progressiveUX.trackInteraction,

        coordinates: geolocation.coordinates,
        hasGPSPermission: geolocation.hasGPSPermission,
        getDistanceKm: geolocation.getDistanceKm,
        formatDistance: geolocation.formatDistance,

        topCategory: behavior.topCategory,
        isReturningUser: behavior.isReturningUser,
        visitCount: behavior.visitCount,
        sessionViews: behavior.sessionViews,
        trackView: behavior.trackView,
        trackLike: behavior.trackLike,
        trackSave: behavior.trackSave,
        trackContact: behavior.trackContact,
        getRecommendedCategories: behavior.getRecommendedCategories,
        hasLiked: behavior.hasLiked,
        hasSaved: behavior.hasSaved,
        getEngagementScore: behavior.getEngagementScore,

        canUseFeature,
    };

    return (
        <VenuzUXContext.Provider value={contextValue}>
            {children}

            <SmartPrompts
                canShowGeoPrompt={progressiveUX.canShowGeoPrompt}
                canShowInstallPrompt={progressiveUX.canShowInstallPrompt}
                canShowPremiumPrompt={progressiveUX.canShowPremiumPrompt}
                onGeoAccept={handleGeoAccept}
                onGeoDecline={handleGeoDecline}
                onInstallAccept={handleInstallAccept}
                onInstallDecline={handleInstallDecline}
                onPremiumAccept={handlePremiumAccept}
                onPremiumDecline={handlePremiumDecline}
                nearbyCount={12}
            />
        </VenuzUXContext.Provider>
    );
}

export function useVenuzUX() {
    const context = useContext(VenuzUXContext);
    if (!context) {
        throw new Error('useVenuzUX must be used within a VenuzUXProvider');
    }
    return context;
}

export default VenuzUXProvider;

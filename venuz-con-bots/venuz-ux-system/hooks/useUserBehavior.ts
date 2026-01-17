'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================
// VENUZ USER BEHAVIOR TRACKING
// ============================================

interface UserPreferences {
    favoriteCategories: Record<string, number>;
    viewedItems: string[];
    likedItems: string[];
    savedItems: string[];
    clickedContacts: string[];
    searchTerms: string[];
    avgTimePerItem: number;
    lastCategories: string[];
    peakHours: number[];
}

interface BehaviorState {
    preferences: UserPreferences;
    sessionViews: number;
    sessionDuration: number;
    isReturningUser: boolean;
    visitCount: number;
    topCategory: string | null;
}

const STORAGE_KEY = 'venuz_user_behavior';
const MAX_HISTORY = 100;

const DEFAULT_PREFERENCES: UserPreferences = {
    favoriteCategories: {},
    viewedItems: [],
    likedItems: [],
    savedItems: [],
    clickedContacts: [],
    searchTerms: [],
    avgTimePerItem: 0,
    lastCategories: [],
    peakHours: [],
};

export function useUserBehavior() {
    const [state, setState] = useState<BehaviorState>({
        preferences: DEFAULT_PREFERENCES,
        sessionViews: 0,
        sessionDuration: 0,
        isReturningUser: false,
        visitCount: 1,
        topCategory: null,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const stored = localStorage.getItem(STORAGE_KEY);
        let preferences = DEFAULT_PREFERENCES;
        let visitCount = 1;

        if (stored) {
            try {
                const data = JSON.parse(stored);
                preferences = { ...DEFAULT_PREFERENCES, ...data.preferences };
                visitCount = (data.visitCount || 0) + 1;
            } catch (e) {
                console.warn('Error loading user behavior:', e);
            }
        }

        const topCategory = Object.entries(preferences.favoriteCategories)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

        const currentHour = new Date().getHours();
        if (!preferences.peakHours.includes(currentHour)) {
            preferences.peakHours = [...preferences.peakHours.slice(-23), currentHour];
        }

        setState({
            preferences,
            sessionViews: 0,
            sessionDuration: 0,
            isReturningUser: visitCount > 1,
            visitCount,
            topCategory,
        });

        savePreferences(preferences, visitCount);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setState(prev => ({
                ...prev,
                sessionDuration: prev.sessionDuration + 1,
            }));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const savePreferences = useCallback((prefs: UserPreferences, visits: number) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            preferences: prefs,
            visitCount: visits,
            lastUpdated: Date.now(),
        }));
    }, []);

    const trackView = useCallback((itemId: string, category: string) => {
        setState(prev => {
            const newPrefs = { ...prev.preferences };

            if (!newPrefs.viewedItems.slice(-10).includes(itemId)) {
                newPrefs.viewedItems = [
                    ...newPrefs.viewedItems.slice(-MAX_HISTORY + 1),
                    itemId,
                ];
            }

            newPrefs.favoriteCategories[category] =
                (newPrefs.favoriteCategories[category] || 0) + 1;

            newPrefs.lastCategories = [
                category,
                ...newPrefs.lastCategories.filter(c => c !== category).slice(0, 4),
            ];

            const topCategory = Object.entries(newPrefs.favoriteCategories)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

            savePreferences(newPrefs, prev.visitCount);

            return {
                ...prev,
                preferences: newPrefs,
                sessionViews: prev.sessionViews + 1,
                topCategory,
            };
        });
    }, [savePreferences]);

    const trackLike = useCallback((itemId: string, category: string) => {
        setState(prev => {
            const newPrefs = { ...prev.preferences };

            if (!newPrefs.likedItems.includes(itemId)) {
                newPrefs.likedItems = [
                    ...newPrefs.likedItems.slice(-MAX_HISTORY + 1),
                    itemId,
                ];

                newPrefs.favoriteCategories[category] =
                    (newPrefs.favoriteCategories[category] || 0) + 3;
            }

            savePreferences(newPrefs, prev.visitCount);

            return {
                ...prev,
                preferences: newPrefs,
            };
        });
    }, [savePreferences]);

    const trackSave = useCallback((itemId: string, category: string) => {
        setState(prev => {
            const newPrefs = { ...prev.preferences };

            if (!newPrefs.savedItems.includes(itemId)) {
                newPrefs.savedItems = [
                    ...newPrefs.savedItems.slice(-MAX_HISTORY + 1),
                    itemId,
                ];

                newPrefs.favoriteCategories[category] =
                    (newPrefs.favoriteCategories[category] || 0) + 5;
            }

            savePreferences(newPrefs, prev.visitCount);

            return {
                ...prev,
                preferences: newPrefs,
            };
        });
    }, [savePreferences]);

    const trackContact = useCallback((itemId: string, category: string) => {
        setState(prev => {
            const newPrefs = { ...prev.preferences };

            newPrefs.clickedContacts = [
                ...newPrefs.clickedContacts.slice(-MAX_HISTORY + 1),
                itemId,
            ];

            newPrefs.favoriteCategories[category] =
                (newPrefs.favoriteCategories[category] || 0) + 10;

            savePreferences(newPrefs, prev.visitCount);

            return {
                ...prev,
                preferences: newPrefs,
            };
        });
    }, [savePreferences]);

    const trackSearch = useCallback((term: string) => {
        setState(prev => {
            const newPrefs = { ...prev.preferences };

            newPrefs.searchTerms = [
                ...newPrefs.searchTerms.slice(-20),
                term.toLowerCase(),
            ];

            savePreferences(newPrefs, prev.visitCount);

            return {
                ...prev,
                preferences: newPrefs,
            };
        });
    }, [savePreferences]);

    const getRecommendedCategories = useCallback((): string[] => {
        return Object.entries(state.preferences.favoriteCategories)
            .sort(([, a], [, b]) => b - a)
            .map(([category]) => category);
    }, [state.preferences.favoriteCategories]);

    const hasViewed = useCallback((itemId: string) =>
        state.preferences.viewedItems.includes(itemId), [state.preferences.viewedItems]);

    const hasLiked = useCallback((itemId: string) =>
        state.preferences.likedItems.includes(itemId), [state.preferences.likedItems]);

    const hasSaved = useCallback((itemId: string) =>
        state.preferences.savedItems.includes(itemId), [state.preferences.savedItems]);

    const getEngagementScore = useCallback((): number => {
        const { viewedItems, likedItems, savedItems, clickedContacts } = state.preferences;

        return (
            viewedItems.length * 1 +
            likedItems.length * 3 +
            savedItems.length * 5 +
            clickedContacts.length * 10
        );
    }, [state.preferences]);

    const resetBehavior = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setState({
            preferences: DEFAULT_PREFERENCES,
            sessionViews: 0,
            sessionDuration: 0,
            isReturningUser: false,
            visitCount: 1,
            topCategory: null,
        });
    }, []);

    return {
        ...state,
        trackView,
        trackLike,
        trackSave,
        trackContact,
        trackSearch,
        getRecommendedCategories,
        hasViewed,
        hasLiked,
        hasSaved,
        getEngagementScore,
        resetBehavior,
    };
}

export default useUserBehavior;

'use client';

// ============================================
// VENUZ - Hook para Favoritos con localStorage
// Permite guardar favoritos sin necesidad de cuenta
// ============================================

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'venuz_favorites';

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Cargar favoritos al montar
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setFavorites(parsed);
                }
            }
        } catch (error) {
            console.error('[VENUZ] Error loading favorites:', error);
        }
        setIsLoaded(true);
    }, []);

    // Guardar en localStorage cuando cambian
    const saveToStorage = useCallback((newFavorites: string[]) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
        } catch (error) {
            console.error('[VENUZ] Error saving favorites:', error);
        }
    }, []);

    // Agregar un favorito
    const addFavorite = useCallback((id: string) => {
        setFavorites(prev => {
            if (prev.includes(id)) return prev;
            const updated = [...prev, id];
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    // Remover un favorito
    const removeFavorite = useCallback((id: string) => {
        setFavorites(prev => {
            const updated = prev.filter(f => f !== id);
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    // Toggle favorito
    const toggleFavorite = useCallback((id: string) => {
        if (favorites.includes(id)) {
            removeFavorite(id);
            return false;
        } else {
            addFavorite(id);
            return true;
        }
    }, [favorites, addFavorite, removeFavorite]);

    // Verificar si es favorito
    const isFavorite = useCallback((id: string) => {
        return favorites.includes(id);
    }, [favorites]);

    // Limpiar todos los favoritos
    const clearFavorites = useCallback(() => {
        setFavorites([]);
        saveToStorage([]);
    }, [saveToStorage]);

    return {
        favorites,
        isLoaded,
        count: favorites.length,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        clearFavorites,
    };
}

export default useFavorites;

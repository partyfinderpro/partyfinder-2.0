'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// ========================================
// TIPOS
// ========================================
interface SearchResult {
    id: string;
    title: string;
    description: string | null;
    category: string;
    image_url: string | null;
    url: string | null;
    location_text: string | null;
    similarity: number;
}

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTime, setSearchTime] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus al abrir
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Manejar búsqueda
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResults([]);
        setSearchTime(null);

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en la búsqueda');
            }

            setResults(data.results || []);
            setSearchTime(data.meta?.totalTime || null);

            if (data.results.length === 0) {
                setError('No se encontraron resultados. Intenta con otras palabras.');
            }

        } catch (err: any) {
            console.error('Error en búsqueda:', err);
            setError(err.message || 'Error al buscar. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Cerrar con ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="container max-w-4xl mx-auto px-4 py-8 h-full flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-venuz-pink">
                            🔍 Búsqueda Inteligente
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="¿Qué buscas hoy? (ej: lugar romántico, fiesta en la playa)"
                                className="w-full px-6 py-4 bg-gray-900 border-2 border-venuz-pink/30 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-venuz-pink text-lg"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-venuz-pink hover:bg-venuz-pink/80 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
                            >
                                {loading ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>

                        {searchTime && (
                            <p className="text-gray-500 text-sm mt-2">
                                ✨ Búsqueda completada en {searchTime}ms
                            </p>
                        )}
                    </form>

                    {/* Results Area */}
                    <div className="flex-1 overflow-y-auto scrollbar-none">
                        {/* Loading State */}
                        {loading && (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-gray-900 rounded-2xl p-4 animate-pulse">
                                        <div className="flex gap-4">
                                            <div className="w-24 h-24 bg-gray-800 rounded-lg" />
                                            <div className="flex-1 space-y-3">
                                                <div className="h-6 bg-gray-800 rounded w-3/4" />
                                                <div className="h-4 bg-gray-800 rounded w-1/2" />
                                                <div className="h-4 bg-gray-800 rounded w-full" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Error State */}
                        {error && !loading && (
                            <div className="bg-red-900/30 border border-red-600/30 rounded-2xl p-6 text-center">
                                <p className="text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Results */}
                        {!loading && results.length > 0 && (
                            <div className="space-y-4">
                                <p className="text-gray-400 mb-4">
                                    Encontrados {results.length} resultados
                                </p>

                                {results.map((result) => (
                                    <motion.a
                                        key={result.id}
                                        href={result.url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="block bg-gray-900 hover:bg-gray-800 rounded-2xl p-4 transition-colors border border-venuz-pink/20 hover:border-venuz-pink/40"
                                    >
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            <div className="flex-shrink-0">
                                                {result.image_url ? (
                                                    <Image
                                                        src={result.image_url}
                                                        alt={result.title}
                                                        width={96}
                                                        height={96}
                                                        className="w-24 h-24 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                                                        <span className="text-4xl">
                                                            {result.category === 'clubs' ? '🎉' :
                                                                result.category === 'restaurants' ? '🍽️' :
                                                                    result.category === 'events' ? '🎪' : '📍'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h3 className="font-semibold text-white text-lg line-clamp-1">
                                                        {result.title}
                                                    </h3>
                                                    <span className="flex-shrink-0 px-2 py-1 bg-venuz-pink/20 text-venuz-pink text-xs rounded-full">
                                                        {Math.round(result.similarity * 100)}% match
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-400 mb-2 capitalize">
                                                    {result.category.replace('_', ' ')}
                                                </p>

                                                {result.description && (
                                                    <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                                                        {result.description}
                                                    </p>
                                                )}

                                                {result.location_text && (
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <span>📍</span>
                                                        {result.location_text}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !error && results.length === 0 && !query && (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🔍</div>
                                <p className="text-gray-400 text-lg">
                                    Escribe algo y presiona Enter para buscar
                                </p>
                                <p className="text-gray-600 text-sm mt-2">
                                    Ejemplos: "lugar romántico", "fiesta LGBT", "cena íntima"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

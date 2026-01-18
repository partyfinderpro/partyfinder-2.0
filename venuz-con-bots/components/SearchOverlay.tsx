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
                className="fixed inset-0 z-[100] bg-deep-black/95 backdrop-blur-md"
                onClick={onClose}
            >
                <div
                    className="container max-w-4xl mx-auto px-4 py-8 h-full flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-display font-black neon-text">
                            🔍 BÚSQUEDA IA
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-casino blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="¿Qué buscas hoy? (ej: lugar romántico, fiesta techno)"
                                className="relative w-full px-6 py-5 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple text-xl backdrop-blur-md transition-all"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                className="absolute right-3 top-1/2 -translate-y-1/2 btn-casino py-2 px-8 text-sm"
                            >
                                {loading ? '🧠 PENSANDO...' : 'BUSCAR'}
                            </button>
                        </div>

                        {searchTime !== null && (
                            <p className="text-gray-500 text-xs mt-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-electric-cyan animate-pulse"></span>
                                Inteligencia sincronizada en {searchTime}ms
                            </p>
                        )}
                    </form>

                    {/* Results Area */}
                    <div className="flex-1 overflow-y-auto scrollbar-casino pr-2">
                        {/* Loading State */}
                        {loading && (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="glass-effect rounded-2xl p-4 animate-pulse">
                                        <div className="flex gap-6">
                                            <div className="w-24 h-24 bg-white/10 rounded-xl" />
                                            <div className="flex-1 space-y-4">
                                                <div className="h-6 bg-white/10 rounded w-3/4" />
                                                <div className="h-4 bg-white/10 rounded w-1/2" />
                                                <div className="h-4 bg-white/10 rounded w-full" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Error State */}
                        {error && !loading && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                                <p className="text-red-400 font-bold">{error}</p>
                            </div>
                        )}

                        {/* Results */}
                        {!loading && results.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">
                                        RESULTADOS ENCONTRADOS ({results.length})
                                    </p>
                                </div>

                                {results.map((result) => (
                                    <motion.a
                                        key={result.id}
                                        href={result.url || '#'}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ scale: 1.01 }}
                                        className="block glass-effect hover:bg-white/10 rounded-2xl p-4 transition-all border border-white/5 hover:border-neon-purple/30 group"
                                    >
                                        <div className="flex gap-6">
                                            {/* Image */}
                                            <div className="flex-shrink-0 relative">
                                                <div className="absolute inset-0 bg-gradient-casino opacity-0 group-hover:opacity-20 blur-md transition-opacity"></div>
                                                {result.image_url ? (
                                                    <Image
                                                        src={result.image_url}
                                                        alt={result.title}
                                                        width={120}
                                                        height={120}
                                                        className="w-24 h-24 object-cover rounded-xl relative z-10"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 bg-white/5 rounded-xl flex items-center justify-center relative z-10">
                                                        <span className="text-4xl">✨</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <h3 className="font-display font-bold text-white text-xl line-clamp-1 group-hover:text-neon-purple transition-colors">
                                                        {result.title}
                                                    </h3>
                                                    <div className="flex-shrink-0 bg-gradient-casino/20 border border-neon-purple/30 px-3 py-1 rounded-full">
                                                        <span className="text-neon-purple font-black text-[10px] tracking-tighter">
                                                            {Math.round(result.similarity * 100)}% MATCH
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-xs font-black text-electric-cyan mb-2 uppercase tracking-widest">
                                                    {result.category.replace('_', ' ')}
                                                </p>

                                                {result.description && (
                                                    <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                                                        {result.description}
                                                    </p>
                                                )}

                                                {result.location_text && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-hot-magenta text-xs">📍</span>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                                                            {result.location_text}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !error && results.length === 0 && !query && (
                            <div className="text-center py-20">
                                <div className="text-7xl mb-6 animate-float">🧠</div>
                                <h3 className="text-2xl font-display font-black text-white mb-3">
                                    EL CEREBRO ESTÁ LISTO
                                </h3>
                                <p className="text-gray-400 text-lg max-w-sm mx-auto">
                                    Pregúntame por lugares románticos, fiestas intensas o experiencias VIP en la ciudad.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

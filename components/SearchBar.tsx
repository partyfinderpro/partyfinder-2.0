// components/SearchBar.tsx
// Búsqueda funcional con debounce
// Código basado en análisis de Grok

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SearchResult {
    id: string;
    title: string;
    description?: string;
    category: string;
    image_url?: string;
    is_verified?: boolean;
}

interface SearchBarProps {
    onResults?: (results: SearchResult[]) => void;
    onSelect?: (result: SearchResult) => void;
    placeholder?: string;
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function SearchBar({ onResults, onSelect, placeholder = "Buscar bares, eventos, soltero..." }: SearchBarProps) {

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedQuery = useDebounce(query, 400);

    // Búsqueda en Supabase
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setResults([]);
            onResults?.([]);
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('content')
                .select('id, title, description, category, image_url, is_verified')
                .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
                .order('views', { ascending: false })
                .limit(10);

            if (error) throw error;

            setResults(data || []);
            onResults?.(data || []);
        } catch (error) {
            console.error('[VENUZ] Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [onResults]);

    // Ejecutar búsqueda cuando cambie el query debounced
    useEffect(() => {
        performSearch(debouncedQuery);
    }, [debouncedQuery, performSearch]);

    // Manejar selección de resultado
    const handleSelect = (result: SearchResult) => {
        onSelect?.(result);
        setQuery('');
        setIsOpen(false);
        setResults([]);
    };

    // Highlight de texto coincidente
    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;

        const regex = new RegExp(`(${query})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, i) =>
            regex.test(part) ? (
                <span key={i} className="bg-pink-500/30 text-pink-300 font-medium">
                    {part}
                </span>
            ) : part
        );
    };

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={inputRef as any}>
            {/* Input de búsqueda */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full pl-12 pr-12 py-3 rounded-2xl bg-white/10 backdrop-blur-xl 
                     border border-white/20 text-white placeholder:text-white/50
                     focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50
                     transition-all duration-300"
                />

                {/* Loading spinner o botón de limpiar */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {loading ? (
                        <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
                    ) : query && (
                        <button
                            onClick={() => {
                                setQuery('');
                                setResults([]);
                                setIsOpen(false);
                            }}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-white/50" />
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown de resultados */}
            <AnimatePresence>
                {isOpen && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl 
                       border border-white/20 rounded-2xl overflow-hidden z-50 shadow-xl"
                    >
                        <div className="max-h-80 overflow-y-auto">
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelect(result)}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-white/10 
                             transition-colors border-b border-white/10 last:border-0 text-left"
                                >
                                    {/* Thumbnail */}
                                    {result.image_url && (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                                            <img
                                                src={result.image_url}
                                                alt={result.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium truncate">
                                                {highlightMatch(result.title, query)}
                                            </span>
                                            {result.is_verified && (
                                                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-white/50">
                                            <span className="capitalize">{result.category}</span>
                                            {result.description && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate">
                                                        {result.description.slice(0, 50)}...
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Sin resultados */}
                {isOpen && query.length >= 2 && !loading && results.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 p-6 bg-black/90 backdrop-blur-xl 
                       border border-white/20 rounded-2xl text-center z-50"
                    >
                        <p className="text-white/50">No encontramos "{query}"</p>
                        <p className="text-sm text-white/30 mt-1">Intenta con otros términos</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

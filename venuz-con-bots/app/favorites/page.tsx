'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useFavorites } from '@/hooks/useFavorites';
import { FavoriteButton } from '@/components/FavoriteButton';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface FavoriteContent {
    id: string;
    title: string;
    description: string | null;
    category: string;
    image_url: string | null;
    url: string | null;
    location_text: string | null;
    favorited_at: string;
}

export default function FavoritesPage() {
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const { favorites } = useFavorites();
    const [content, setContent] = useState<FavoriteContent[]>([]);
    const [loading, setLoading] = useState(true);

    // Check auth
    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setAuthLoading(false);
        }
        checkAuth();
    }, []);

    // Load favorites content
    useEffect(() => {
        async function loadFavoriteContent() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const { data, error } = await supabase
                    .rpc('get_user_favorites', {
                        p_user_id: user.id
                    });

                if (error) throw error;

                setContent(data || []);
            } catch (err) {
                console.error('Error cargando favoritos:', err);
            } finally {
                setLoading(false);
            }
        }

        loadFavoriteContent();
    }, [user, favorites]);

    // Loading state
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-pink-400">Cargando favoritos...</p>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Inicia sesión para ver tus favoritos
                    </h1>
                    <p className="text-gray-400 mb-6">
                        Guarda tus lugares favoritos para acceder a ellos fácilmente
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    // Empty state
    if (content.length === 0) {
        return (
            <div className="min-h-screen bg-black">
                <header className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-8">
                    <div className="max-w-4xl mx-auto">
                        <Link href="/" className="text-pink-200 hover:text-white mb-4 inline-block">
                            ← Volver
                        </Link>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            ❤️ Mis Favoritos
                        </h1>
                        <p className="text-pink-100 mt-2">
                            Tus lugares guardados aparecerán aquí
                        </p>
                    </div>
                </header>

                <div className="flex items-center justify-center px-4 py-20">
                    <div className="text-center max-w-md">
                        <div className="text-6xl mb-4">💔</div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Aún no tienes favoritos
                        </h2>
                        <p className="text-gray-400 mb-6">
                            Explora lugares increíbles y guarda tus favoritos con el botón ❤️
                        </p>
                        <Link
                            href="/"
                            className="inline-block bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
                        >
                            Explorar lugares
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Content grid
    return (
        <div className="min-h-screen bg-black pb-20">
            <header className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-8 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto">
                    <Link href="/" className="text-pink-200 hover:text-white mb-4 inline-block">
                        ← Volver
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        ❤️ Mis Favoritos
                    </h1>
                    <p className="text-pink-100 mt-2">
                        {content.length} {content.length === 1 ? 'lugar guardado' : 'lugares guardados'}
                    </p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-900 rounded-2xl overflow-hidden border border-pink-500/20 hover:border-pink-500/40 transition-colors"
                        >
                            <div className="relative h-48">
                                {item.image_url ? (
                                    <Image
                                        src={item.image_url}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                        <span className="text-6xl">
                                            {item.category === 'club' ? '🎉' :
                                                item.category === 'restaurante' ? '🍽️' :
                                                    item.category === 'evento' ? '🎪' : '📍'}
                                        </span>
                                    </div>
                                )}

                                <div className="absolute top-3 right-3">
                                    <FavoriteButton contentId={item.id} />
                                </div>
                            </div>

                            <div className="p-4">
                                <span className="inline-block px-3 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full capitalize mb-3">
                                    {item.category?.replace('_', ' ')}
                                </span>

                                <h3 className="font-bold text-xl text-white mb-2 line-clamp-2">
                                    {item.title}
                                </h3>

                                {item.description && (
                                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                        {item.description}
                                    </p>
                                )}

                                {item.location_text && (
                                    <p className="text-gray-500 text-xs flex items-center gap-1 mb-3">
                                        <span>📍</span>
                                        {item.location_text}
                                    </p>
                                )}

                                {item.url && (
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-pink-500 hover:bg-pink-600 text-white text-center py-2 rounded-lg font-semibold transition-colors"
                                    >
                                        Ver más
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

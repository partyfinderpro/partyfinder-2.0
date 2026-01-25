// app/profile/page.tsx
// Página de perfil con sección de favoritos
// Código de Grok

'use client';

import { useSupabaseClient, useUser } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import ContentCard from '@/components/ContentCard';
import { User, Heart, Settings, LogOut, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    const supabase = useSupabaseClient();
    const user = useUser();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        async function loadFavorites() {
            try {
                const { data: likes } = await supabase
                    .from('interactions')
                    .select('content_id')
                    .eq('user_id', user!.id)
                    .eq('type', 'like');

                if (likes?.length) {
                    const ids = likes.map(l => l.content_id);
                    const { data } = await supabase
                        .from('content')
                        .select('*')
                        .in('id', ids);
                    setFavorites(data || []);
                }
            } catch (err) {
                console.error('Error loading favorites:', err);
            } finally {
                setLoading(false);
            }
        }

        loadFavorites();
    }, [user, supabase]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 text-center">
                <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20">
                    <User className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-4">Inicia sesión</h1>
                    <p className="text-white/50 mb-6">Necesitas una cuenta para guardar tus favoritos.</p>
                    <a href="/auth/login" className="px-8 py-3 bg-pink-500 rounded-full inline-block">
                        Ir a Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black p-4 md:p-8">
            <div className="max-w-6xl mx-auto pt-20">

                {/* Header de Perfil */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] mb-12 flex flex-col md:flex-row items-center gap-8"
                >
                    <div className="w-32 h-32 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-white mb-2">{user.email}</h1>
                        <p className="text-white/50">Miembro desde {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                            <Settings className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="p-4 bg-red-500/20 text-red-400 rounded-2xl hover:bg-red-500/30 transition-colors"
                        >
                            <LogOut className="w-6 h-6" />
                        </button>
                    </div>
                </motion.div>

                {/* Sección Favoritos */}
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                    <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                    Mis Favoritos ({favorites.length})
                </h2>

                {favorites.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                        <p className="text-white/30">Aún no tienes favoritos. ¡Explora el feed!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {favorites.map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <ContentCard content={item} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// app/profile/page.tsx
// Página de perfil con sección de favoritos
// Código de Grok

'use client';

import { useSupabaseClient, useUser } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import ContentCard from '@/components/ContentCard';
import { User, Heart, Settings, LogOut, Loader2, Share2, Copy, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
    const supabase = useSupabaseClient();
    const user = useUser();
    const t = useTranslations('nav');
    const tv = useTranslations('venue');
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        async function loadProfile() {
            try {
                // Load favorites
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

                // Load referral info
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('referral_code')
                    .eq('id', user!.id)
                    .maybeSingle();

                if (profile?.referral_code) {
                    setReferralCode(profile.referral_code);
                } else {
                    // Si no tiene perfil o código, intentamos generar uno vía RPC (si el usuario pulsa un botón)
                }

            } catch (err) {
                console.error('Error loading profile data:', err);
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [user, supabase]);

    const handleGenerateReferral = async () => {
        if (!user) return;
        try {
            const { data: code, error } = await supabase.rpc('generate_referral_code');
            if (error) throw error;
            setReferralCode(code);
        } catch (err) {
            console.error('Error generating referral code:', err);
        }
    };

    const copyToClipboard = () => {
        if (!referralCode) return;
        const url = `${window.location.origin}/ref/${referralCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 text-center bg-black">
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 max-w-sm w-full">
                    <User className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-4">Inicia sesión</h1>
                    <p className="text-white/50 mb-6">Necesitas una cuenta para guardar tus favoritos y ganar premios.</p>
                    <a href="/auth/login" className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold block">
                        Ir a Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24 md:pt-32">
            <div className="max-w-6xl mx-auto">

                {/* Header de Perfil - Casino/VIP Style */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[48px] mb-12 flex flex-col md:flex-row items-center gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[80px] -z-10 rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] -z-10 rounded-full" />

                    <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-tr from-pink-500 via-purple-600 to-blue-500 rounded-full flex items-center justify-center text-4xl font-black shadow-[0_0_30px_rgba(236,72,153,0.3)] border-4 border-white/10">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 p-2 bg-green-500 rounded-full border-4 border-black">
                            <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                            <h1 className="text-3xl font-black tracking-tight">{user.email?.split('@')[0]}</h1>
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">VIP MEMBER</span>
                        </div>
                        <p className="text-white/40 font-medium">@{user.id.substring(0, 8)}</p>
                    </div>

                    <div className="flex gap-4">
                        <button className="p-5 bg-white/5 rounded-[24px] hover:bg-white/10 border border-white/10 transition-all active:scale-95">
                            <Settings className="w-6 h-6 text-white/70" />
                        </button>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="p-5 bg-red-500/10 text-red-500 rounded-[24px] border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-95"
                        >
                            <LogOut className="w-6 h-6" />
                        </button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Viral Referral System Card */}
                    <div className="col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-neutral-900 border border-white/5 p-8 rounded-[40px] h-full"
                        >
                            <div className="p-4 bg-pink-500/10 rounded-2xl w-fit mb-6">
                                <Share2 className="w-6 h-6 text-pink-500" />
                            </div>
                            <h3 className="text-2xl font-black mb-2">GANA ACCESO VIP</h3>
                            <p className="text-white/40 mb-8 text-sm leading-relaxed">
                                Invita a tus amigos. Por cada 3 registros, obtienes 1 mes de recompensas exclusivas.
                            </p>

                            {referralCode ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
                                        <code className="text-pink-400 font-bold">{referralCode}</code>
                                        <button
                                            onClick={copyToClipboard}
                                            className="text-white/40 hover:text-white transition-colors"
                                        >
                                            {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-pink-500 hover:text-white transition-all shadow-xl active:scale-[0.98]"
                                    >
                                        COPIAR LINK
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerateReferral}
                                    className="w-full py-4 bg-pink-500 text-white font-black rounded-2xl shadow-xl hover:shadow-pink-500/20 transition-all active:scale-[0.98]"
                                >
                                    GENERAR CÓDIGO
                                </button>
                            )}
                        </motion.div>
                    </div>

                    {/* Sección Favoritos */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black flex items-center gap-3 italic">
                                MIS FAVORITOS
                                <span className="bg-pink-500/20 text-pink-400 text-sm px-3 py-1 rounded-full">{favorites.length}</span>
                            </h2>
                        </div>

                        {favorites.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10 group hover:border-pink-500/30 transition-colors">
                                <Heart className="w-12 h-12 text-white/10 mx-auto mb-4 group-hover:text-pink-500/20 transition-colors" />
                                <p className="text-white/30 font-medium">Aún no tienes favoritos. ¡Explora el feed!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {favorites.map(item => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <ContentCard content={item} />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

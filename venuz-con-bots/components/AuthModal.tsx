// components/AuthModal.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Chrome, Sparkles } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const getCallbackUrl = () => {
        if (process.env.NEXT_PUBLIC_SITE_URL) {
            return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
        }
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/auth/callback`;
        }
        return '/auth/callback';
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const redirectTo = getCallbackUrl();

            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: redirectTo,
                        data: {
                            name: name || email.split('@')[0],
                        },
                    },
                });

                if (error) throw error;
                setMessage('¡Registro exitoso! Revisa tu email para confirmar.');
                setTimeout(() => {
                    onClose();
                    setMessage(null);
                }, 3000);

            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
                setMessage('¡Bienvenido de nuevo!');
                setTimeout(() => {
                    onClose();
                    window.location.reload();
                }, 1000);
            }
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError(null);
        try {
            const redirectTo = getCallbackUrl();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Error con Google');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    className="relative w-full max-w-md overflow-hidden"
                >
                    {/* Background Decorative Glow */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-venuz-pink/20 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-venuz-gold/10 rounded-full blur-[100px]" />

                    <div className="relative backdrop-blur-3xl bg-zinc-900/50 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-10">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Title Section */}
                        <div className="mb-10 text-center">
                            <h1 className="text-4xl font-display font-black text-white mb-3 tracking-tighter">
                                {mode === 'signin' ? 'HOLA DE NUEVO' : 'ÚNETE A VENUZ'}
                            </h1>
                            <p className="text-gray-400 font-medium">
                                Para guardar tus lugares favoritos y dar likes.
                            </p>
                        </div>

                        {/* Error/Success */}
                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold text-center">
                                {error}
                            </motion.div>
                        )}
                        {message && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm font-bold text-center">
                                {message}
                            </motion.div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-5">
                            {mode === 'signup' && (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-venuz-pink/30 focus:bg-white/10 transition-all"
                                            placeholder="Tu nombre completo"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-venuz-pink/30 focus:bg-white/10 transition-all"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-venuz-pink/30 focus:bg-white/10 transition-all"
                                        placeholder="Tu contraseña"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-gradient-to-r from-venuz-pink to-venuz-red rounded-2xl text-white font-black text-lg shadow-glow-pink hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? 'ESPERA...' : mode === 'signin' ? 'INICIAR SESIÓN' : 'REGISTRARME'}
                            </button>
                        </form>

                        <div className="relative my-10">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
                                <span className="px-4 bg-[#18181b] text-gray-500">O TAMBIÉN</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={handleGoogleAuth}
                                disabled={loading}
                                className="flex items-center justify-center gap-3 w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all group"
                            >
                                <Chrome className="w-5 h-5" />
                                <span>Entrar con Google</span>
                            </button>
                        </div>

                        <div className="mt-10 text-center">
                            <button
                                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                className="text-sm font-bold text-gray-400 hover:text-venuz-pink transition-colors"
                            >
                                {mode === 'signin'
                                    ? '¿ERES NUEVO? CREAR CUENTA'
                                    : '¿YA TIENES CUENTA? ENTRAR'
                                }
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

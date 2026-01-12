// components/AuthModal.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User } from 'lucide-react';

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

    // Using singleton supabase client from lib/supabaseClient

    // Obtener la URL de callback correcta
    const getCallbackUrl = () => {
        // Priorizar variable de entorno (para producción)
        if (process.env.NEXT_PUBLIC_SITE_URL) {
            return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
        }

        // Fallback a window.location (para desarrollo)
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/auth/callback`;
        }

        // Último fallback (no debería llegar aquí)
        return '/auth/callback';
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const redirectTo = getCallbackUrl();
            console.log('🔐 [AuthModal] Callback URL:', redirectTo);

            if (mode === 'signup') {
                // Registro
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: redirectTo,
                        data: {
                            name: name || email.split('@')[0], // Usar nombre o email como fallback
                        },
                    },
                });

                if (error) {
                    console.error('🔐 [AuthModal] Signup error:', error);
                    throw error;
                }

                console.log('🔐 [AuthModal] Signup successful:', data.user?.email);
                setMessage('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');

                // Cerrar modal después de 3 segundos
                setTimeout(() => {
                    onClose();
                    setMessage(null);
                }, 3000);

            } else {
                // Inicio de sesión
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    console.error('🔐 [AuthModal] Signin error:', error);
                    throw error;
                }

                console.log('🔐 [AuthModal] Signin successful:', data.user?.email);
                setMessage('¡Inicio de sesión exitoso!');

                // Cerrar modal y recargar
                setTimeout(() => {
                    onClose();
                    window.location.reload();
                }, 1000);
            }
        } catch (err: any) {
            console.error('🔐 [AuthModal] Auth error:', err);
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
            console.log('🔐 [AuthModal] Google OAuth redirect:', redirectTo);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                },
            });

            if (error) {
                console.error('🔐 [AuthModal] Google OAuth error:', error);
                throw error;
            }

            console.log('🔐 [AuthModal] Google OAuth initiated');
            // El usuario será redirigido a Google
        } catch (err: any) {
            console.error('🔐 [AuthModal] Google auth error:', err);
            setError(err.message || 'Error de autenticación con Google');
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email) {
            setError('Por favor ingresa tu email');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const redirectTo = getCallbackUrl();
            console.log('🔐 [AuthModal] Magic link redirect:', redirectTo);

            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: redirectTo,
                },
            });

            if (error) {
                console.error('🔐 [AuthModal] Magic link error:', error);
                throw error;
            }

            console.log('🔐 [AuthModal] Magic link sent to:', email);
            setMessage('¡Link mágico enviado! Revisa tu email.');

            setTimeout(() => {
                onClose();
                setMessage(null);
            }, 3000);

        } catch (err: any) {
            console.error('🔐 [AuthModal] Magic link error:', err);
            setError(err.message || 'Error al enviar link mágico');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md"
                >
                    {/* Glass Card */}
                    <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {mode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-white/70 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                                {message}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleAuth} className="space-y-4">
                            {/* Name (solo en signup) */}
                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        Nombre
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-pink-500/50"
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-pink-500/50"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-pink-500/50"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Cargando...' : mode === 'signin' ? 'Entrar' : 'Registrarse'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-black/50 text-white/50">O continúa con</span>
                            </div>
                        </div>

                        {/* Social Auth */}
                        <div className="space-y-3">
                            <button
                                onClick={handleGoogleAuth}
                                disabled={loading}
                                className="w-full py-3 bg-white/10 border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition-all disabled:opacity-50"
                            >
                                🔍 Google
                            </button>

                            <button
                                onClick={handleMagicLink}
                                disabled={loading}
                                className="w-full py-3 bg-white/10 border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition-all disabled:opacity-50"
                            >
                                ✨ Link Mágico
                            </button>
                        </div>

                        {/* Toggle Mode */}
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                className="text-sm text-white/70 hover:text-white transition-colors"
                            >
                                {mode === 'signin'
                                    ? '¿No tienes cuenta? Regístrate'
                                    : '¿Ya tienes cuenta? Inicia sesión'
                                }
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

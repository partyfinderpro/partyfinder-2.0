// app/auth/login/page.tsx
'use client';

import { useSupabaseClient } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
    const supabase = useSupabaseClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams?.get('redirectTo') || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push(redirectTo);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
        >
            {/* Logo */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    VENUZ
                </h1>
                <p className="text-white/50 mt-2">Inicia sesión para continuar</p>
            </div>

            {/* Form */}
            <form
                onSubmit={handleLogin}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
            >
                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Email */}
                <div className="mb-4">
                    <label className="block text-white/70 text-sm mb-2">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 
                       text-white placeholder:text-white/30 focus:outline-none focus:ring-2 
                       focus:ring-pink-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="mb-6">
                    <label className="block text-white/70 text-sm mb-2">Contraseña</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 
                       text-white placeholder:text-white/30 focus:outline-none focus:ring-2 
                       focus:ring-pink-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl 
                   text-white font-semibold flex items-center justify-center gap-2
                   hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Iniciar Sesión
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                {/* Links */}
                <div className="mt-6 text-center">
                    <p className="text-white/50 text-sm">
                        ¿No tienes cuenta?{' '}
                        <Link href="/auth/signup" className="text-pink-400 hover:text-pink-300">
                            Regístrate
                        </Link>
                    </p>
                </div>
            </form>

            {/* Back to home */}
            <div className="mt-6 text-center">
                <Link href="/" className="text-white/50 text-sm hover:text-white">
                    ← Volver al inicio
                </Link>
            </div>
        </motion.div>
    );
}

function LoginFallback() {
    return (
        <div className="w-full max-w-md flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
            <Suspense fallback={<LoginFallback />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}

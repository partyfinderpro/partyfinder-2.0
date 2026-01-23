// app/auth/signup/page.tsx
'use client';

import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
    const supabase = useSupabaseClient();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/`,
            },
        });

        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center"
                >
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">¡Registro exitoso!</h2>
                    <p className="text-white/60 mb-6">
                        Revisa tu email para confirmar tu cuenta. Después podrás iniciar sesión.
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-block px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors"
                    >
                        Ir a Login
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
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
                    <p className="text-white/50 mt-2">Crea tu cuenta gratis</p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSignup}
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
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
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
                                <User className="w-5 h-5" />
                                Crear Cuenta
                            </>
                        )}
                    </button>

                    {/* Links */}
                    <div className="mt-6 text-center">
                        <p className="text-white/50 text-sm">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/auth/login" className="text-pink-400 hover:text-pink-300">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>

                    {/* Terms */}
                    <p className="mt-4 text-white/30 text-xs text-center">
                        Al registrarte, aceptas ser mayor de 18 años y nuestros términos de servicio.
                    </p>
                </form>

                {/* Back to home */}
                <div className="mt-6 text-center">
                    <Link href="/" className="text-white/50 text-sm hover:text-white">
                        ← Volver al inicio
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

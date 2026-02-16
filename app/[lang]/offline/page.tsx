
import React from 'react';
import { WifiOff, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-8 venuz-glass p-10 rounded-[2.5rem] border-glow animate-float">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-pink-500 blur-3xl opacity-20 animate-pulse" />
                        <WifiOff className="w-24 h-24 text-pink-500 relative z-10" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tight text-gradient-pink">
                        TE QUEDASTE OFFLINE
                    </h1>
                    <p className="text-white/60 text-lg font-medium leading-relaxed">
                        Parece que perdiste la conexión. Pero no te preocupes, VENUZ sigue siendo tu mejor compañía.
                    </p>
                </div>

                <div className="pt-6">
                    <Link
                        href="/"
                        className="venuz-button inline-flex items-center gap-2 group w-full justify-center"
                    >
                        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        REINTENTAR ACCESO
                    </Link>
                </div>

                <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold pt-4">
                    VENUZ - Entretenimiento Adulto México
                </p>
            </div>
        </div>
    );
}

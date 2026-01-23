"use client";

import { WifiOff, RefreshCw, Home } from "lucide-react";
import { useEffect, useState } from "react";

export default function OfflinePage() {
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        // Check connection status
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // If back online, redirect to home
    useEffect(() => {
        if (isOnline) {
            window.location.href = "/";
        }
    }, [isOnline]);

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-md mx-auto">
                {/* Icon */}
                <div className="mb-8">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/30">
                        <WifiOff className="w-12 h-12 text-pink-400" />
                    </div>
                </div>

                {/* Logo */}
                <h1 className="text-4xl font-black mb-4">
                    <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                        VENUZ
                    </span>
                </h1>

                {/* Message */}
                <h2 className="text-2xl font-bold text-white mb-3">
                    Sin conexión
                </h2>
                <p className="text-white/60 mb-8 leading-relaxed">
                    Parece que perdiste la conexión a internet.
                    Verifica tu WiFi o datos móviles e intenta de nuevo.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleRetry}
                        className="
              flex items-center justify-center gap-2
              px-6 py-3 rounded-xl
              bg-gradient-to-r from-pink-500 to-rose-500
              text-white font-semibold
              hover:from-pink-600 hover:to-rose-600
              transition-all duration-300
              shadow-lg shadow-pink-500/30
            "
                    >
                        <RefreshCw className="w-5 h-5" />
                        Reintentar
                    </button>

                    <a
                        href="/"
                        className="
              flex items-center justify-center gap-2
              px-6 py-3 rounded-xl
              bg-white/10 backdrop-blur-sm
              text-white/80 font-semibold
              hover:bg-white/20
              transition-colors
              border border-white/10
            "
                    >
                        <Home className="w-5 h-5" />
                        Ir al inicio
                    </a>
                </div>

                {/* Tips */}
                <div className="mt-12 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-semibold text-white/80 mb-2">
                        💡 Tips para reconectarte:
                    </h3>
                    <ul className="text-sm text-white/50 space-y-1 text-left">
                        <li>• Activa y desactiva el modo avión</li>
                        <li>• Cambia de WiFi a datos móviles</li>
                        <li>• Acércate al router</li>
                        <li>• Reinicia tu dispositivo</li>
                    </ul>
                </div>
            </div>

            {/* Footer */}
            <p className="fixed bottom-6 text-xs text-white/30">
                VENUZ funciona mejor con conexión a internet
            </p>
        </div>
    );
}

'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { motion } from 'framer-motion';

export default function NotificationToggle() {
    const { isSupported, isSubscribed, permission, subscribe, unsubscribe, loading } = usePushNotifications();

    if (!isSupported) {
        return (
            <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-xl p-4">
                <p className="text-yellow-400 text-sm">⚠️ Tu navegador no soporta notificaciones push</p>
            </div>
        );
    }

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    return (
        <div className="bg-gray-900 rounded-xl p-6 border border-pink-500/20">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">
                        🔔 Notificaciones Push
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                        {isSubscribed
                            ? 'Recibirás notificaciones sobre eventos y lugares nuevos'
                            : 'Activa las notificaciones para no perderte nada'}
                    </p>

                    {permission === 'denied' && (
                        <p className="text-red-400 text-xs mb-2">
                            ❌ Has bloqueado las notificaciones. Habilítalas en configuración del navegador.
                        </p>
                    )}
                </div>

                <motion.button
                    onClick={handleToggle}
                    disabled={loading || permission === 'denied'}
                    className={`
            relative w-14 h-8 rounded-full transition-colors
            ${isSubscribed ? 'bg-pink-500' : 'bg-gray-700'}
            ${loading || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
                    whileTap={{ scale: 0.95 }}
                >
                    <motion.div
                        className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                        animate={{ x: isSubscribed ? 24 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />

                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </motion.button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className="text-gray-400">{isSubscribed ? 'Activo' : 'Inactivo'}</span>
                </div>
            </div>
        </div>
    );
}

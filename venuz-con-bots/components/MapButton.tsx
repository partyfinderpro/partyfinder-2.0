'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { MapPlace } from './MapView';

// Importación dinámica para evitar SSR issues con Leaflet
const MapView = dynamic(() => import('./MapView'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
    )
});

interface MapButtonProps {
    places: MapPlace[];
    onPlaceClick?: (place: MapPlace) => void;
}

export default function MapButton({ places, onPlaceClick }: MapButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { coordinates } = useGeolocation();
    const latitude = coordinates?.lat;
    const longitude = coordinates?.lng;

    return (
        <>
            {/* Botón flotante */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 left-6 z-40 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-[0_10px_40px_rgba(59,130,246,0.5)] transition-all hover:scale-110 active:scale-95"
                aria-label="Ver mapa"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                </svg>
            </button>

            {/* Modal con mapa */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="absolute inset-0 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex-shrink-0 bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        🗺️ Mapa VENUZ
                                    </h2>
                                    <p className="text-pink-100 text-sm">
                                        {places.length} {places.length === 1 ? 'lugar' : 'lugares'}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-white hover:text-pink-200 transition-colors p-2"
                                    aria-label="Cerrar mapa"
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Mapa */}
                            <div className="flex-1 relative">
                                <MapView
                                    places={places}
                                    userLat={latitude}
                                    userLng={longitude}
                                    onPlaceClick={(place) => {
                                        if (onPlaceClick) {
                                            onPlaceClick(place);
                                            setIsOpen(false);
                                        }
                                    }}
                                />
                            </div>

                            {/* Footer info */}
                            {latitude && longitude ? (
                                <div className="flex-shrink-0 bg-blue-900/30 border-t border-blue-600/30 px-6 py-3">
                                    <p className="text-blue-400 text-sm text-center">
                                        🌍 Ubicación activada • Mostrando lugares cerca de ti
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-shrink-0 bg-yellow-900/30 border-t border-yellow-600/30 px-6 py-3">
                                    <p className="text-yellow-400 text-sm text-center">
                                        📍 Activa tu ubicación para ver lugares cercanos
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

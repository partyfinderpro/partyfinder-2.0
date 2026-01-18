// app/place/[id]/PlaceDetailClient.tsx
'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Clock, Phone, ExternalLink, Navigation, Heart, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import FavoriteButton from '@/components/FavoriteButton';
import { useAuthContext } from '@/context/AuthContext';

interface PlaceDetailClientProps {
    place: {
        id: string;
        title: string;
        description?: string | null;
        image_url?: string | null;
        category?: string | null;
        source?: string | null;
        location_text?: string | null;
        lat?: number | null;
        lng?: number | null;
        rating?: number | null;
        total_ratings?: number | null;
        is_open_now?: boolean;
        google_maps_url?: string | null;
        url?: string | null;
        source_url?: string | null;
        metadata?: any;
    };
}

export default function PlaceDetailClient({ place }: PlaceDetailClientProps) {
    const { openAuthModal } = useAuthContext();
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: place.title,
                text: place.description || `Mira ${place.title} en VENUZ`,
                url: window.location.href,
            });
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert('Link copiado!');
        }
    };

    const getCategoryEmoji = (category?: string | null): string => {
        const emojis: Record<string, string> = {
            club: '🎉', bar: '🍺', restaurante: '🍽️', evento: '🎊',
            concierto: '🎸', show: '🎭', feria: '🎪', tabledance: '💃',
            escort: '💋', masaje: '💆', beach: '🏖️', hotel: '🏨',
        };
        return emojis[category || ''] || '📍';
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Image */}
            <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-venuz-pink/30 to-purple-900/30 animate-pulse" />
                )}
                <img
                    src={place.image_url || 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1200'}
                    alt={place.title}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                {/* Back Button */}
                <Link
                    href="/"
                    className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/70 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>

                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/70 transition-all"
                >
                    <Share2 className="w-5 h-5" />
                </button>

                {/* Category Badge Floating */}
                <div className="absolute bottom-4 left-4 z-20">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-sm font-bold">
                        <span>{getCategoryEmoji(place.category)}</span>
                        <span className="uppercase tracking-wider">{place.category || 'VIP'}</span>
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8 -mt-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
                                {place.title}
                            </h1>

                            {/* Rating */}
                            {place.rating && (
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex items-center gap-1 bg-amber-500/20 px-3 py-1 rounded-full">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        <span className="text-amber-400 font-bold">{place.rating.toFixed(1)}</span>
                                    </div>
                                    {place.total_ratings && (
                                        <span className="text-white/50 text-sm">
                                            ({place.total_ratings.toLocaleString()} reseñas)
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Location */}
                            {place.location_text && (
                                <div className="flex items-center gap-2 text-white/70">
                                    <MapPin className="w-4 h-4 text-venuz-pink" />
                                    <span className="text-sm">{place.location_text}</span>
                                </div>
                            )}
                        </div>

                        {/* Favorite Button */}
                        <FavoriteButton
                            contentId={place.id}
                            size="lg"
                            onAuthRequired={openAuthModal}
                        />
                    </div>

                    {/* Status & Quick Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {/* Open Status */}
                        {place.is_open_now !== undefined && (
                            <div className={`p-4 rounded-xl border ${place.is_open_now ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs text-white/50 uppercase">Estado</span>
                                </div>
                                <p className={`font-bold ${place.is_open_now ? 'text-green-400' : 'text-red-400'}`}>
                                    {place.is_open_now ? 'Abierto' : 'Cerrado'}
                                </p>
                            </div>
                        )}

                        {/* Phone (for escorts) */}
                        {place.metadata?.phone && (
                            <a
                                href={`tel:${place.metadata.phone}`}
                                className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-xs text-white/50 uppercase">Contacto</span>
                                </div>
                                <p className="font-bold text-venuz-pink">{place.metadata.phone}</p>
                            </a>
                        )}

                        {/* Price (if available) */}
                        {place.metadata?.price && (
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-white/50 uppercase">Precio</span>
                                </div>
                                <p className="font-bold text-venuz-gold">${place.metadata.price}</p>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {place.description && (
                        <div className="mb-8">
                            <h3 className="text-sm text-white/50 uppercase tracking-wider mb-3">Descripción</h3>
                            <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                                {place.description}
                            </p>
                        </div>
                    )}

                    {/* Map Preview (Static) */}
                    {place.lat && place.lng && (
                        <div className="mb-8">
                            <h3 className="text-sm text-white/50 uppercase tracking-wider mb-3">Ubicación</h3>
                            <div className="relative h-[200px] rounded-xl overflow-hidden border border-white/10">
                                <img
                                    src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+ff1493(${place.lng},${place.lat})/${place.lng},${place.lat},14,0/600x200@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
                                    alt="Mapa"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x200/1a1a1a/ff1493?text=📍+Mapa';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Google Maps */}
                        {(place.google_maps_url || (place.lat && place.lng)) && (
                            <a
                                href={place.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-venuz-pink to-venuz-red text-white font-bold py-4 px-6 rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-venuz-pink/20"
                            >
                                <Navigation className="w-5 h-5" />
                                <span>Cómo llegar</span>
                            </a>
                        )}

                        {/* Source URL */}
                        {(place.url || place.source_url) && (
                            <a
                                href={place.url || place.source_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold py-4 px-6 rounded-xl hover:bg-white/20 transition-all"
                            >
                                <ExternalLink className="w-5 h-5" />
                                <span>Ver fuente</span>
                            </a>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

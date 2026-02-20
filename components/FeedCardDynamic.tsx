// components/FeedCardDynamic.tsx
'use client';

import { useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { cn } from "@/lib/utils";
import { Heart, Share2, ExternalLink, MapPin, Sparkles, BadgeCheck, Eye, ThumbsDown } from 'lucide-react';
import { useInteractions } from '@/hooks/useInteractions';
import { useUserIntent } from '@/hooks/useUserIntent';
import { notifyUserInteraction } from '@/components/PushNotificationPrompt';
import type { ContentItem } from '@/hooks/useContent';

// Import dinámico para evitar SSR issues con media players
const DynamicPreview = dynamic(() => import('./DynamicPreview'), { ssr: false });

interface FeedCardDynamicProps {
    item: ContentItem;
    className?: string;
    onClick?: (id: string) => void;
    onShare?: (id: string) => void;
    isActive?: boolean;
    slotType?: 'standard' | 'hero_banner' | 'video_reel' | 'compact_grid';
    neonEffect?: boolean;
}

// ── Función para determinar el tipo de card ──
function getCardVariant(item: ContentItem) {
    if (item.category === 'webcam') return 'webcam'
    // Si la fuente es google maps o tiene latitud, es un lugar físico
    if ((item.category !== 'webcam' && item.category !== 'online') &&
        (item.source_url?.includes('maps.google') || item.source_url?.includes('google.com/maps') || item.location)) {
        return 'place'
    }
    return 'content'
}

// ── Badge component ──
function CardBadge({ variant }: { variant: string }) {
    if (variant === 'webcam') {
        return (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full z-20 shadow-lg shadow-red-500/30 animate-pulse uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                EN VIVO
            </div>
        )
    }
    if (variant === 'place') {
        return (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/80 backdrop-blur-md text-cyan-400 text-[10px] font-bold px-3 py-1.5 rounded-full z-20 border border-cyan-400/30 shadow-lg uppercase tracking-wider">
                <MapPin className="w-3 h-3" />
                Puerto Vallarta
            </div>
        )
    }
    return (
        <div className="absolute top-4 left-4 bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full z-20 shadow-lg">
            ✨ Destacado
        </div>
    )
}

// ── Botón de acción por tipo ──
function CardAction({ item, variant }: { item: ContentItem; variant: string }) {
    if (variant === 'webcam') {
        const url = item.affiliate_url || item.source_url
        if (!url) return null;
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block w-full mt-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-bold text-center rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 pointer-events-auto"
            >
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                🔴 Ver Ahora — Gratis
            </a>
        )
    }
    if (variant === 'place') {
        // Construir URL de maps si no existe
        const mapsUrl = item.source_url?.includes('maps') ? item.source_url :
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((item.title || '') + ' Puerto Vallarta')}`

        return (
            <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block w-full mt-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold text-center rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 pointer-events-auto border border-white/10"
            >
                <MapPin className="w-4 h-4" />
                🗺️ Ver en Maps
            </a>
        )
    }
    return null
}

// ... (existing helper functions if any)

export default function FeedCardDynamic({
    item,
    className = '',
    onClick,
    onShare,
    isActive,
    slotType = 'standard',
    neonEffect = false
}: FeedCardDynamicProps) {
    const {
        liked,
        disliked,
        likesCount,
        toggleLike,
        toggleDislike,
        registerShare
    } = useInteractions({
        contentId: item.id,
        initialLikes: item.likes || 0,
        initialViews: item.views || 0,
    });

    // ✨ PASO 3: Inteligencia de Carretera (Highway Intent Tracking)
    const { recordLike, recordView } = useUserIntent();

    const pillar = (item as any).pillar || 'event'; // Default to event if not specified

    // Sincronizar Likes con Highway
    const handleToggleLike = async () => {
        await toggleLike();
        if (!liked) { // Si estamos dando like ahora (estaba en false)
            await recordLike(item.id, pillar);
            notifyUserInteraction(); // 🔔 Señal para el sistema de notificaciones
        }
    };

    // Sincronizar Vistas con Highway
    useEffect(() => {
        if (isActive) {
            recordView(item.id, pillar);
        }
    }, [isActive, item.id, pillar, recordView]);

    const variant = useMemo(() => getCardVariant(item), [item]);

    // Mapeo inteligente de URLs según disponibilidad
    // Prioridad: preview_video > video_url > iframe > image
    const previewType = item.preview_type ||
        (item.preview_video_url ? 'video' :
            (item.video_url ? 'video' : 'image'));

    const videoUrl = item.preview_video_url || item.video_url;
    const imageUrl = item.image_url || item.thumbnail_url;

    // Calcular tier visual
    const isPremium = item.content_tier === 'premium' || item.is_premium;
    const isVerified = item.content_tier === 'verified' || item.is_verified;

    // Extra data details for Vegas Strip
    const vegasStyle = item.extra_data?.visual_style || item.visual_style || {};
    const neonColor = neonEffect ? (vegasStyle.neonColor || '#ff0088') : null;

    // Aspect ratio responsive según slot
    const aspectClass = slotType === 'hero_banner'
        ? 'aspect-[16/9] lg:aspect-[21/9]'
        : slotType === 'video_reel'
            ? 'aspect-[9/16]'
            : 'aspect-[9/16]';

    return (
        <div
            className={cn(
                "relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl group transition-all duration-500",
                aspectClass,
                neonEffect && "ring-1",
                className
            )}
            style={{
                boxShadow: neonEffect ? `0 0 25px ${neonColor}60, 0 0 50px ${neonColor}30, inset 0 0 10px ${neonColor}20` : undefined,
                borderColor: neonEffect ? `${neonColor}` : undefined,
                borderWidth: neonEffect ? '2px' : '0px',
            }}
        >
            {/* Neon Border Bloom (Only if neonEffect) */}
            {neonEffect && (
                <div
                    className="absolute inset-0 z-0 pointer-events-none opacity-30 blur-2xl animate-pulse"
                    style={{ backgroundColor: neonColor }}
                />
            )}
            {/* Componente de Preview Dinámico (Video/Iframe/Imagen) */}
            <DynamicPreview
                type={previewType}
                videoUrl={videoUrl}
                iframeUrl={item.iframe_preview_url}
                imageUrl={imageUrl}
                embedCode={item.embed_code}
                posterUrl={item.thumbnail_url || imageUrl}
                affiliateUrl={item.affiliate_url}
                officialWebsite={item.official_website || item.source_url}
                hasAffiliate={item.has_affiliate || !!item.affiliate_url}
                contentId={item.id}
                isActive={isActive}
                className="absolute inset-0"
            />

            {/* Overlay Grid para interactividad */}
            <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => onClick?.(item.id)}
            >
                {/* Gradiente superior para visibilidad de badges */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

                {/* Gradiente inferior para textos */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
            </div>

            {/* Badges Superiores (NUEVO) */}
            <div className="absolute top-0 left-0 w-full p-4 z-20 pointer-events-none flex justify-between items-start">
                <CardBadge variant={variant} />

                {/* Premium/Verified Tags Small */}
                <div className="flex gap-1">
                    {isPremium && <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">VIP</span>}
                </div>
            </div>

            {/* Acciones Laterales (Estilo TikTok) */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-4 z-30 pointer-events-auto">
                {/* Like Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleLike(); }}
                    className="group/btn flex flex-col items-center gap-1"
                >
                    <div className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${liked ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40' : 'bg-black/40 text-white hover:bg-black/60'}`}>
                        <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''} transition-transform group-hover/btn:scale-110`} />
                    </div>
                    <span className="text-white text-xs font-bold shadow-black drop-shadow-md">
                        {likesCount}
                    </span>
                </button>

                {/* Share Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        registerShare();
                        onShare?.(item.id);
                    }}
                    className="group/btn flex flex-col items-center gap-1"
                >
                    <div className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md text-white transition-all duration-300">
                        <Share2 className="w-6 h-6 transition-transform group-hover/btn:scale-110" />
                    </div>
                    <span className="text-white text-xs font-bold shadow-black drop-shadow-md">
                        Share
                    </span>
                </button>

                {/* Dislike Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleDislike(); }}
                    className="group/btn flex flex-col items-center gap-1"
                >
                    <div className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${disliked ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-black/40 text-white hover:bg-black/60'}`}>
                        <ThumbsDown className={`w-6 h-6 ${disliked ? 'fill-current' : ''} transition-transform group-hover/btn:scale-110`} />
                    </div>
                    <span className="text-white text-xs font-bold shadow-black drop-shadow-md">
                        Pass
                    </span>
                </button>
            </div>

            {/* Info Inferior */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-20 pointer-events-none">
                <div className="pr-16 space-y-2"> {/* Padding right para no solapar botones */}
                    {/* Título */}
                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-lg">
                        {item.title}
                    </h3>

                    {/* Descripción Corta */}
                    {item.description && (
                        <p className="text-white/80 text-sm line-clamp-2 drop-shadow-md font-medium">
                            {item.description}
                        </p>
                    )}

                    {/* Metadata: Location & Views */}
                    <div className="flex items-center gap-4 text-xs text-white/60 pt-1">
                        {item.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-pink-500" />
                                {item.location}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.views || 0} vistos
                        </span>
                    </div>
                </div>

                {/* CTA Botón Principal (Dinámico por variante) */}
                <div className="mt-4 pointer-events-auto">
                    {/* Usamos el componente CardAction para Maps o Webcams */}
                    {variant !== 'content' ? (
                        <CardAction item={item} variant={variant} />
                    ) : (
                        /* Botón Genérico para contenido estándar */
                        <button
                            onClick={() => onClick?.(item.id)}
                            className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>Ver Detalles</span>
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div >
        </div >
    );
}

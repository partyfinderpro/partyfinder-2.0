// components/FeedCardDynamic.tsx
'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { cn } from "@/lib/utils";
import { Heart, Share2, ExternalLink, MapPin, Sparkles, BadgeCheck, Eye } from 'lucide-react';
import { useInteractions } from '@/hooks/useInteractions';
import type { ContentItem } from '@/hooks/useContent';

// Import dinámico para evitar SSR issues con media players
const DynamicPreview = dynamic(() => import('./DynamicPreview'), { ssr: false });

interface FeedCardDynamicProps {
    item: ContentItem;
    className?: string;
    onClick?: (id: string) => void;
    onShare?: (id: string) => void;
    isActive?: boolean;
}

export default function FeedCardDynamic({
    item,
    className = '',
    onClick,
    onShare
}: FeedCardDynamicProps) {
    // Hook de interacciones (Likes, Views, Shares)
    const {
        liked,
        likesCount,
        toggleLike,
        registerShare
    } = useInteractions({
        contentId: item.id,
        initialLikes: item.likes || 0,
        initialViews: item.views || 0,
    });

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

    return (
        <div className={cn("relative w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl group", className)}>
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

            {/* Badges Superiores */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
                <div className="flex gap-2 flex-wrap">
                    {/* Categoría */}
                    {item.category && (
                        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/10">
                            {item.category}
                        </span>
                    )}

                    {/* Premium Badge */}
                    {isPremium && (
                        <span className="bg-gradient-to-r from-amber-400 to-yellow-600 text-black text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-black" />
                            VIP
                        </span>
                    )}

                    {/* Verified Badge */}
                    {isVerified && (
                        <span className="bg-blue-500/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3" />
                            Verificado
                        </span>
                    )}
                </div>

                {/* Live Indicator */}
                {(item.viewers_now || item.preview_type === 'embed') && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-lg shadow-red-500/30">
                        <span className="w-1.5 h-1.5 bg-white rounded-full" />
                        LIVE
                    </span>
                )}
            </div>

            {/* Acciones Laterales (Estilo TikTok) */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-4 z-30 pointer-events-auto">
                {/* Like Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleLike(); }}
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

                {/* CTA Botón Principal (Solo si es interactivo) */}
                <div className="mt-4 pointer-events-auto">
                    <button
                        onClick={() => onClick?.(item.id)}
                        className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>Ver Detalles</span>
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

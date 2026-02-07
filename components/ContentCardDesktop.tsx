
"use client";

import { memo, useEffect, useCallback } from "react";
import {
    Heart,
    Share2,
    ExternalLink,
    Eye,
    MapPin,
    Sparkles,
    BadgeCheck
} from "lucide-react";
import { useInteractions } from "@/hooks/useInteractions";
import { sanitizeImageUrl } from "@/lib/media";
import { VideoPlayer } from "./ContentCard";

interface ContentItem {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    video_url?: string;
    thumbnail_url?: string;
    category: string;
    location?: string;
    views?: number;
    likes?: number;
    is_verified?: boolean;
    is_premium?: boolean;
    viewers_now?: number;
    affiliate_url?: string;
    affiliate_source?: string;
    source_url?: string;
}

interface ContentCardDesktopProps {
    content: ContentItem;
    isActive?: boolean;
    onClick?: (id: string) => void;
    onShare?: (id: string) => void;
}

export default function ContentCardDesktop({
    content,
    isActive,
    onClick,
    onShare,
}: ContentCardDesktopProps) {
    const {
        liked,
        likesCount,
        viewsCount,
        toggleLike,
        registerShare,
        registerView
    } = useInteractions({
        contentId: content.id,
        initialLikes: content.likes || 0,
        initialViews: content.views || 0,
    });

    // Auto registrar vista en Desktop si es visible
    useEffect(() => {
        if (isActive) {
            registerView();
        }
    }, [isActive, registerView]);

    const imageUrl = sanitizeImageUrl(
        content.image_url,
        content.affiliate_source,
        content.source_url
    );

    return (
        <div className="venuz-card group overflow-hidden shadow-2xl">
            <div
                className="relative h-[450px] xl:h-[500px] overflow-hidden bg-[#121214] rounded-[2.5rem] border border-white/5 shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
                {content.video_url && isActive ? (
                    <VideoPlayer
                        src={content.video_url}
                        thumbnail={imageUrl}
                        isActive={isActive}
                        className="w-full h-full"
                    />
                ) : (
                    <div
                        className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                    >
                        <img
                            src={imageUrl}
                            alt={content.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800";
                            }}
                            referrerPolicy="no-referrer"
                        />
                    </div>
                )}

                {/* Gradient Overlays */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent z-10" />
                <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/40 to-transparent z-10" />

                {/* Badges superiores */}
                <div className="absolute top-6 left-6 flex gap-3 flex-wrap z-20">
                    {content.is_premium && (
                        <span className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[10px] font-black rounded-full flex items-center gap-1.5 shadow-lg shadow-amber-500/20 uppercase tracking-widest">
                            <Sparkles className="w-3.5 h-3.5 fill-current" />
                            VIP
                        </span>
                    )}
                    <span className="px-4 py-2 bg-pink-500/90 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                        {content.category}
                    </span>
                    {content.is_verified && (
                        <span className="px-4 py-2 bg-blue-500/90 backdrop-blur-md text-white text-[10px] font-black rounded-full flex items-center gap-1.5 uppercase tracking-widest">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Real Verificada
                        </span>
                    )}
                </div>

                {/* Provider Domain Badge - Discreto */}
                {content.source_url && (
                    <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2">
                        {/* Badge de origen más discreto */}
                        <span className="px-2 py-1 bg-black/40 backdrop-blur-sm text-white/50 text-[8px] font-medium rounded-md lowercase tracking-wide">
                            via {content.source_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                        </span>
                        {/* Badge LIVE - este sí es prominente */}
                        {content.viewers_now && (
                            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse shadow-xl shadow-red-600/20 tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                                LIVE {content.viewers_now.toLocaleString()}
                            </span>
                        )}
                    </div>
                )}

                {!content.source_url && content.viewers_now && (
                    <div className="absolute top-6 right-6 z-20">
                        <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse shadow-xl shadow-red-600/20 tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                            LIVE {content.viewers_now.toLocaleString()}
                        </span>
                    </div>
                )}

                {/* Info en la parte inferior */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                    <div className="max-w-2xl">
                        <h2 className="text-xl md:text-2xl font-bold mb-3 text-white leading-tight group-hover:text-pink-400 transition-colors duration-300 line-clamp-2">
                            {content.title}
                        </h2>
                        <p className="text-white/60 text-lg mb-6 line-clamp-2 font-medium leading-relaxed">
                            {content.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-6 text-sm font-semibold text-white/40">
                                <span className="flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-pink-500/60" />
                                    {(viewsCount || content.views || 0).toLocaleString()} vistos
                                </span>
                                <span className="flex items-center gap-2">
                                    <Heart className={`w-5 h-5 ${liked ? 'text-pink-500 fill-current' : 'text-pink-500/60'}`} />
                                    {likesCount.toLocaleString()}
                                </span>
                                {content.location && (
                                    <span className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-pink-500/60" />
                                        {content.location}
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => onClick?.(content.id)}
                                className="flex items-center gap-3 px-8 py-3 bg-white text-black rounded-full font-bold text-sm tracking-wider hover:bg-pink-500 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl"
                            >
                                Explorar Perfil
                                <span className="text-xl">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions (Barra inferior separada) */}
            <div className="mt-4 px-6 py-4 bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-[1.5rem] flex items-center justify-between">
                <div className="flex gap-8">
                    <button
                        onClick={() => toggleLike()}
                        className={`transition-all duration-300 flex items-center gap-2.5 font-bold text-xs uppercase tracking-widest ${liked ? 'text-pink-500' : 'text-white/30 hover:text-pink-500'}`}
                    >
                        <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                        {liked ? 'Guardado' : 'Favorito'}
                    </button>
                    <button
                        onClick={() => {
                            registerShare();
                            if (onShare) onShare(content.id);
                        }}
                        className="text-white/30 hover:text-blue-400 transition-all duration-300 flex items-center gap-2.5 font-bold text-xs uppercase tracking-widest"
                    >
                        <Share2 className="w-5 h-5" />
                        Compartir
                    </button>
                </div>

                {/* Botón CTA - Siempre visible si hay destino */}
                {(content.affiliate_url || content.source_url) && (
                    <a
                        href={content.affiliate_url ? `/api/go?id=${content.id}` : content.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-[0.15em] shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${content.affiliate_url
                            ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-pink-500/20'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                            }`}
                    >
                        {content.affiliate_url ? 'Entrar Live' : 'Visitar Sitio'}
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
            </div>
        </div>
    );
}

// 🚀 Memoized version for better performance
export const MemoizedContentCardDesktop = memo(ContentCardDesktop, (prevProps, nextProps) => {
    return (
        prevProps.content.id === nextProps.content.id &&
        prevProps.isActive === nextProps.isActive
    );
});

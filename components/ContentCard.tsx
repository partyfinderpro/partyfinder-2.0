"use client";

import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  Clock,
  Heart,
  Share2,
  ExternalLink,
  Play,
  BadgeCheck,
  Sparkles,
  Eye,
  MessageCircle,
} from "lucide-react";
import { useInteractions } from "@/hooks/useInteractions";
import { useHighwayTracking } from "@/hooks/useHighwayTracking";
import { sanitizeImageUrl } from "@/lib/media";

// Interfaces
interface ContentItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  category: string;
  subcategory?: string;
  location?: string;
  distance_km?: number;
  rating?: number;
  is_verified?: boolean;
  is_premium?: boolean;
  is_open_now?: boolean;
  open_until?: string;
  affiliate_url?: string;
  affiliate_source?: "camsoda" | "stripchat" | "chaturbate" | "other";
  views?: number;
  likes?: number;
  created_at?: string;
  viewers_now?: number;
  source_url?: string;
}

interface ContentCardProps {
  content: ContentItem;
  isActive?: boolean;
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
  onClick?: (id: string) => void;
}

// Placeholder images por categoría
const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  soltero: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
  modelo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80",
  club: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80",
  bar: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
  evento: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
  concierto: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
  webcam: "https://images.unsplash.com/photo-1527613426441-4da1d4b674dd?w=800&q=80",
  default: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
};

const PROBLEMATIC_DOMAINS = [
  "camsoda.com",
  "stripchat.com",
  "chaturbate.com",
  "maps.googleapis.com",
  "googleapis.com",
  "googleusercontent.com"
];

const shouldUseUnoptimized = (url: string): boolean => {
  if (!url) return false;
  return PROBLEMATIC_DOMAINS.some(domain => url.includes(domain));
};

// Componente de Video con Lazy Loading Avanzado (v4)
export function VideoPlayer({
  src,
  thumbnail,
  isActive,
  className,
}: {
  src: string;
  thumbnail?: string;
  isActive?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        
        const video = videoRef.current;
        if (!video) return;

        if (entry.isIntersecting) {
          // Lazy loading del src: solo cargar cuando está cerca/visible
          if (!video.src || video.src === '') {
            video.src = src;
            video.load();
          }
          
          if (isActive) {
            video.play().catch(() => {
              // Bloqueado o error silencioso
            });
          }
        } else {
          video.pause();
          // Opcional: si queremos liberar mucha memoria en feeds infinitos:
          // video.src = "";
          // video.load();
        }
      },
      {
        rootMargin: "300px 0px", // Precarga antes de que entre al viewport
        threshold: 0.1,
      }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [src, isActive]);

  // Sincronizar play/pause con el estado activo (TikTok style)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isIntersecting) return;

    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive, isIntersecting]);

  return (
    <div className={`relative bg-black/20 ${className}`}>
      <video
        ref={videoRef}
        poster={thumbnail}
        loop
        muted
        playsInline
        preload="none"
        onLoadedData={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-40'}`}
      />
      {!isLoaded && isIntersecting && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function ContentCard({
  content,
  isActive,
  onLike,
  onShare,
  onClick,
}: ContentCardProps) {
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

  // 🚀 Highway v4 Tracking
  const {
    startTracking,
    stopTracking,
    trackClick,
    trackShare
  } = useHighwayTracking({
    itemId: content.id,
    categorySlug: content.category,
    isPremium: content.is_premium
  });

  // Sincronizar tracking con visibilidad (Mobile TikTok style)
  useEffect(() => {
    if (isActive) {
      registerView();
      startTracking();
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [isActive, registerView, startTracking, stopTracking]);


  const [imgError, setImgError] = useState(false);

  const imageUrl = sanitizeImageUrl(
    content.image_url || CATEGORY_PLACEHOLDERS[content.category] || CATEGORY_PLACEHOLDERS.default,
    content.affiliate_source,
    content.source_url
  );

  const displayImageUrl = imgError ? (CATEGORY_PLACEHOLDERS[content.category] || CATEGORY_PLACEHOLDERS.default) : imageUrl;

  const isAffiliate = Boolean(content.affiliate_url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onClick={() => onClick?.(content.id)}
      className={`
        relative group cursor-pointer 
        rounded-[2rem] overflow-hidden
        bg-[#121214] border border-white/5
        shadow-2xl transition-all duration-500
        ${content.is_premium ? 'ring-1 ring-amber-500/30' : ''}
      `}
    >
      {/* Glow Effect for Premium */}
      {content.is_premium && (
        <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      )}

      {/* Media Container */}
      <div className="relative aspect-[4/5] overflow-hidden">
        {content.video_url && isActive ? (
          <VideoPlayer
            src={content.video_url}
            thumbnail={displayImageUrl}
            isActive={isActive}
            className="w-full h-full"
          />
        ) : (
          <motion.div
            className="w-full h-full"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
          >
            <Image
              src={displayImageUrl}
              alt={content.title}
              fill
              className="object-cover"
              unoptimized={shouldUseUnoptimized(displayImageUrl)}
              onError={() => setImgError(true)}
            />
          </motion.div>
        )}


        {/* Gradient Overlays */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#121214] via-[#121214]/40 to-transparent z-10" />
        <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/40 to-transparent z-10" />

        {/* Badges Overlay */}
        <div className="absolute top-5 inset-x-5 flex justify-between items-start z-20">
          <div className="flex flex-col gap-2">
            {content.is_verified && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
                <BadgeCheck className="w-3.5 h-3.5" />
                Real
              </span>
            )}
            {content.is_premium && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[10px] font-black uppercase tracking-widest shadow-lg">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                VIP
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {content.source_url && (
              <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-bold border border-white/10 uppercase tracking-widest">
                {content.source_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
              </span>
            )}
            {content.viewers_now ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                LIVE
              </span>
            ) : (
              (viewsCount > 0 || content.views) && (
                <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-bold border border-white/10">
                  {(viewsCount || content.views || 0).toLocaleString()} vistos
                </span>
              )
            )}
          </div>
        </div>

        {/* Info Overlay (Bottom) */}
        <div className="absolute bottom-5 inset-x-5 z-20">
          <div className="flex items-center gap-2 mb-2 font-black text-[10px] tracking-[0.2em] text-pink-500 uppercase">
            <span>{content.category}</span>
            {content.subcategory && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-white/40">{content.subcategory}</span>
              </>
            )}
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors duration-300">
            {content.title}
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium text-white/50">
            {content.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-pink-500" />
                {content.location}
              </span>
            )}
            {content.rating && (
              <span className="flex items-center gap-1 text-amber-500">
                ⭐ {content.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Dynamic Actions */}
      <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-b from-[#121214] to-black border-t border-white/5">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
              onLike?.(content.id);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 transition-all duration-300 ${liked ? "text-pink-500" : "text-white/30 hover:text-white"}`}
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            <span className="text-xs font-bold">{likesCount.toLocaleString()}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              registerShare();
              if (onShare) onShare(content.id);
            }}
            className="p-1.5 text-white/30 hover:text-white transition-all duration-300"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>

        {isAffiliate && (
          <motion.a
            href={`/api/go?id=${content.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              trackClick();
            }}

            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 25px rgba(236, 72, 153, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            className="
              px-6 py-2.5 rounded-full
              bg-gradient-to-r from-pink-500 to-rose-600
              text-white font-black text-[10px] uppercase tracking-widest
              shadow-xl shadow-pink-500/20
              flex items-center gap-2
            "
          >
            Entrar
            <ExternalLink className="w-3.5 h-3.5" />
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}

// 🚀 Memoized version to prevent re-renders
export const MemoizedContentCard = memo(ContentCard, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.content.id === nextProps.content.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.content.likes === nextProps.content.likes
  );
});

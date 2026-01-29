"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  Clock,
  Heart,
  Share2,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  BadgeCheck,
  Sparkles,
  Eye,
} from "lucide-react";
import { useInteractions } from "@/hooks/useInteractions";

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
  escort: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
  modelo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80",
  club: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80",
  bar: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
  evento: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
  concierto: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
  default: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80",
};

// FIX #2: Manejo robusto de imágenes de afiliados y externos
const PROBLEMATIC_DOMAINS = [
  "camsoda.com",
  "stripchat.com",
  "chaturbate.com",
  "maps.googleapis.com",
  "googleapis.com",
  "googleusercontent.com"
];

const getProxiedImageUrl = (url: string, source?: string): string => {
  if (!url) return CATEGORY_PLACEHOLDERS.default;
  return url;
};

// Helper para determinar si usar unoptimized
const shouldUseUnoptimized = (url: string): boolean => {
  if (!url) return false;
  // Si ya es un placeholder de Unsplash, no necesita unoptimized
  if (url.includes("unsplash.com")) return false;
  return PROBLEMATIC_DOMAINS.some(domain => url.includes(domain));
};

// Componente de Video con Lazy Loading
function VideoPlayer({
  src,
  thumbnail,
  isActive,
  className,
}: {
  src: string;
  thumbnail?: string;
  isActive: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Auto-play cuando está activo
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive && isLoaded) {
      videoRef.current.play().catch(() => { });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, isLoaded]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Thumbnail mientras carga */}
      {!isLoaded && thumbnail && (
        <Image
          src={thumbnail}
          alt="Video thumbnail"
          fill
          className="object-cover"
        />
      )}

      {/* Video Element - Solo se carga cuando isActive */}
      {isActive && (
        <video
          ref={videoRef}
          src={src}
          poster={thumbnail}
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          onLoadedData={() => setIsLoaded(true)}
          className={`
            absolute inset-0 w-full h-full object-cover
            transition-opacity duration-500
            ${isLoaded ? "opacity-100" : "opacity-0"}
          `}
        />
      )}

      {/* Video Controls Overlay */}
      <AnimatePresence>
        {(showControls || !isPlaying) && isLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center"
          >
            {/* Play/Pause Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
              className="
                w-16 h-16 rounded-full
                bg-white/20 backdrop-blur-sm
                border border-white/30
                flex items-center justify-center
                text-white
              "
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </motion.button>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="
                absolute bottom-4 right-4
                p-2 rounded-full
                bg-black/50 backdrop-blur-sm
                text-white/80 hover:text-white
              "
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente principal ContentCard
export default function ContentCard({
  content,
  isActive = false,
  onLike,
  onShare,
  onClick,
}: ContentCardProps) {
  const {
    liked,
    likesCount,
    toggleLike,
    registerView
  } = useInteractions({
    contentId: content.id,
    initialLikes: content.likes || 0
  });

  const [imageError, setImageError] = useState(false);

  // Registrar vista cuando el card está activo (Persistence)
  useEffect(() => {
    if (isActive) {
      registerView();
    }
  }, [isActive, registerView]);

  const hasVideo = Boolean(content.video_url);
  const isAffiliate = Boolean(content.affiliate_url);

  // Determinar la imagen a mostrar
  const displayImage = imageError
    ? CATEGORY_PLACEHOLDERS[content.category?.toLowerCase()] || CATEGORY_PLACEHOLDERS.default
    : getProxiedImageUrl(content.image_url || "", content.affiliate_source);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike();
    onLike?.(content.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(content.id);
  };

  const handleClick = () => {
    // Siempre llamar onClick para abrir el modal interstitial
    // El modal se encargará de mostrar el warning y abrir el affiliate
    onClick?.(content.id);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleClick}
      className={`
        relative w-full aspect-[9/16] sm:aspect-[3/4]
        rounded-3xl overflow-hidden
        cursor-pointer
        group
        ${isActive ? "ring-2 ring-pink-500/50" : ""}
      `}
    >
      {/* Media Layer - FIX #4: Renderizado condicional de video */}
      <div className="absolute inset-0">
        {hasVideo && content.video_url ? (
          <VideoPlayer
            src={content.video_url}
            thumbnail={content.thumbnail_url || content.image_url}
            isActive={isActive}
            className="w-full h-full"
          />
        ) : (
          <img
            src={displayImage}
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading={isActive ? "eager" : "lazy"}
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-60" />

      {/* Top Badges */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Category Badge */}
          <span className="
            px-3 py-1.5 rounded-full
            text-xs font-semibold
            bg-black/40 backdrop-blur-md
            border border-white/10
            text-white/90
          ">
            {content.category}
          </span>

          {/* Verified Badge */}
          {content.is_verified && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="
                px-3 py-1.5 rounded-full
                text-xs font-semibold
                bg-gradient-to-r from-blue-500/80 to-cyan-500/80
                backdrop-blur-md
                text-white
                flex items-center gap-1
              "
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              Verificado
            </motion.span>
          )}

          {/* Premium Badge */}
          {content.is_premium && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="
                px-3 py-1.5 rounded-full
                text-xs font-semibold
                bg-gradient-to-r from-amber-500/80 to-yellow-500/80
                backdrop-blur-md
                text-white
                flex items-center gap-1
              "
            >
              <Sparkles className="w-3.5 h-3.5" />
              Premium
            </motion.span>
          )}
        </div>

        {/* Open Status */}
        {content.is_open_now !== undefined && (
          <span className={`
            px-3 py-1.5 rounded-full
            text-xs font-semibold
            backdrop-blur-md
            ${content.is_open_now
              ? "bg-emerald-500/80 text-white"
              : "bg-red-500/80 text-white"
            }
          `}>
            {content.is_open_now ? "Abierto" : "Cerrado"}
          </span>
        )}
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
        {/* Title & Description */}
        <div className="mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 line-clamp-2">
            {content.title}
          </h3>
          {content.description && (
            <p className="text-sm text-white/70 line-clamp-2">
              {content.description}
            </p>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/60 mb-4">
          {content.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-pink-400" />
              {content.location}
              {content.distance_km && (
                <span className="text-pink-400">
                  • {content.distance_km.toFixed(1)} km
                </span>
              )}
            </span>
          )}
          {content.open_until && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Hasta {content.open_until}
            </span>
          )}
          {content.views !== undefined && (
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {content.views.toLocaleString()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Like Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className={`
              flex items-center gap-2
              px-4 py-2.5 rounded-xl
              transition-all duration-300
              ${liked
                ? "bg-pink-500 text-white"
                : "bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20"
              }
            `}
          >
            <Heart
              className={`w-5 h-5 ${liked ? "fill-current" : ""}`}
            />
            <span className="text-sm font-semibold">
              {likesCount.toLocaleString()}
            </span>
          </motion.button>

          {/* Share Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="
              p-2.5 rounded-xl
              bg-white/10 backdrop-blur-sm
              text-white/80 hover:bg-white/20
              transition-colors
            "
          >
            <Share2 className="w-5 h-5" />
          </motion.button>

          {/* Affiliate Link Button */}
          {isAffiliate && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="
                ml-auto
                flex items-center gap-2
                px-4 py-2.5 rounded-xl
                bg-gradient-to-r from-pink-500 to-rose-500
                text-white font-semibold text-sm
                shadow-lg shadow-pink-500/30
              "
            >
              Ver en vivo
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Video indicator */}
      {hasVideo && !isActive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="
            w-16 h-16 rounded-full
            bg-white/20 backdrop-blur-sm
            border border-white/30
            flex items-center justify-center
          ">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Affiliate Source Badge */}
      {content.affiliate_source && (
        <div className="absolute top-4 right-4">
          <span className="
            px-2 py-1 rounded-md
            text-[10px] font-bold uppercase
            bg-gradient-to-r from-pink-600 to-purple-600
            text-white
          ">
            {content.affiliate_source}
          </span>
        </div>
      )}
    </motion.article>
  );
}

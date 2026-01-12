'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Bookmark, MapPin, Clock, Star, Navigation } from 'lucide-react';
import { useState } from 'react';
import { useInteractions } from '@/hooks/useInteractions';
import { LikeButton } from './LikeButton';
import clsx from 'clsx';

interface ContentCardProps {
  content: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    video_url: string | null;
    category: string | null;
    source: string | null;
    location?: string;
    tags?: string[] | null;

    // Google Places data
    rating?: number;
    total_ratings?: number;
    is_open_now?: boolean;
    google_maps_url?: string;
  };
  isActive: boolean;
}

export default function ContentCard({ content, isActive }: ContentCardProps) {
  const {
    isLiked,
    isSaved,
    likesCount,
    toggleLike,
    toggleSave
  } = useInteractions(content.id);

  const [imageLoaded, setImageLoaded] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-100, 0, 100], [0.5, 1, 0.5]);

  // Formatear rating
  const formattedRating = content.rating?.toFixed(1);

  return (
    <motion.article
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="relative h-screen w-full snap-start snap-always overflow-hidden bg-black"
    >
      {/* Background Image con Parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y, opacity }}
      >
        <div className="relative h-full w-full">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-venuz-pink/20 via-black to-purple-900/20 animate-pulse" />
          )}

          <img
            src={content.image_url || 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1200'}
            alt={content.title}
            className={clsx(
              "h-full w-full object-cover transition-opacity duration-700",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        </div>
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 flex h-full flex-col justify-between p-6 pb-24 md:p-12">

        {/* Top Section: Category & Status */}
        <div className="flex items-start justify-between pt-safe">
          {/* Category Badge */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass px-4 py-2 rounded-full"
          >
            <span className="text-xs font-bold text-white uppercase tracking-widest">
              {content.category || content.source || 'VIP'}
            </span>
          </motion.div>

          {/* Open/Closed Status */}
          {content.is_open_now !== undefined && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={clsx(
                "glass border rounded-full px-4 py-2 flex items-center gap-2",
                content.is_open_now
                  ? "bg-green-500/20 border-green-400/30"
                  : "bg-red-500/20 border-red-400/30"
              )}
            >
              <Clock className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white tracking-widest">
                {content.is_open_now ? 'ABIERTO' : 'CERRADO'}
              </span>
            </motion.div>
          )}
        </div>

        {/* Bottom Section: Info & Actions */}
        <div className="space-y-6 max-w-2xl">

          {/* Google Rating */}
          {content.rating && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-strong border-amber-400/30 rounded-2xl p-4 inline-flex items-center gap-3"
            >
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-xl font-bold text-white">
                  {formattedRating}
                </span>
              </div>
              <span className="text-xs text-white/70 font-medium">
                ({content.total_ratings?.toLocaleString()} reseñas)
              </span>
            </motion.div>
          )}

          {/* Title & Description */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight font-display tracking-tight glow">
              {content.title}
            </h1>

            {content.description && (
              <p className="text-base md:text-lg text-white/80 leading-relaxed line-clamp-3 font-body font-medium">
                {content.description}
              </p>
            )}

            {/* Location */}
            {(content.location || content.source) && (
              <div className="flex items-center gap-2 text-white/70">
                <MapPin className="w-4 h-4 text-venuz-pink" />
                <span className="text-sm font-semibold tracking-wide">{content.location || content.source || 'PUERTO VALLARTA'}</span>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-end gap-4"
          >
            {/* Like Button */}
            <LikeButton
              isLiked={isLiked}
              onClick={toggleLike}
              count={likesCount}
            />

            {/* Save Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleSave}
              className={clsx(
                "glass rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300",
                isSaved
                  ? "bg-venuz-gold/30 border-venuz-gold/50"
                  : "hover:bg-white/20"
              )}
            >
              <Bookmark
                className={clsx(
                  "w-6 h-6 transition-all duration-300",
                  isSaved ? "fill-venuz-gold text-venuz-gold scale-110" : "text-white"
                )}
              />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                Guardar
              </span>
            </motion.button>

            {/* Directions Button */}
            {(content.google_maps_url || content.location) && (
              <motion.a
                href={content.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.title + ' ' + (content.location || 'Puerto Vallarta'))}`}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.9 }}
                className="glass bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/40 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/30 transition-all duration-300"
              >
                <Navigation className="w-6 h-6 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  Mapa
                </span>
              </motion.a>
            )}
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
}

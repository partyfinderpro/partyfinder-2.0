'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Bookmark, MapPin, Clock, Star, Navigation } from 'lucide-react';
import { useState } from 'react';
import { useInteractions } from '@/hooks/useInteractions';
import { useAuthContext } from '@/context/AuthContext';
import { LikeButton } from './LikeButton';
import FavoriteButton from './FavoriteButton';
import ImageCarousel from './ImageCarousel';
import clsx from 'clsx';

interface ContentCardProps {
  content: {
    id: string;
    title: string;
    description?: string | null;
    image_url?: string | null;
    video_url?: string | null;
    category?: string | null;
    source?: string | null;
    location?: string;
    tags?: string[] | null;
    images?: string[];

    // Google Places data
    rating?: number;
    total_ratings?: number;
    is_open_now?: boolean;
    google_maps_url?: string;
    // Distance from user
    distance_meters?: number;
  };
  isActive: boolean;
}

export default function ContentCard({ content, isActive }: ContentCardProps) {
  const { openAuthModal } = useAuthContext();
  const {
    isLiked,
    isSaved,
    likesCount,
    toggleLike,
    toggleSave
  } = useInteractions(content.id);

  /* const [imageLoaded, setImageLoaded] = useState(false); */

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
        <div className="relative h-full w-full bg-zinc-900">
          <ImageCarousel
            images={content.images?.length ? content.images : (content.image_url ? [content.image_url] : [])}
            alt={content.title}
          />
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

            {/* Location + Distance */}
            {(content.location || content.source) && (
              <div className="flex items-center gap-2 text-white/70 flex-wrap">
                <MapPin className="w-4 h-4 text-venuz-pink" />
                <span className="text-sm font-semibold tracking-wide">{content.location || content.source || 'PUERTO VALLARTA'}</span>
                {content.distance_meters && (
                  <span className="text-xs bg-venuz-pink/20 text-venuz-pink px-2 py-0.5 rounded-full font-bold">
                    {content.distance_meters < 1000
                      ? `${Math.round(content.distance_meters)}m`
                      : `${(content.distance_meters / 1000).toFixed(1)}km`
                    }
                  </span>
                )}
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
              onClick={async (e) => {
                const result = await toggleLike();
                if (result?.error === 'login_required') {
                  openAuthModal();
                }
              }}
              count={likesCount}
            />

            {/* Favorite Button - Persistente en DB */}
            <FavoriteButton
              contentId={content.id}
              size="md"
              onAuthRequired={openAuthModal}
            />

            {/* Save Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={async (e) => {
                const result = await toggleSave();
                if (result?.error === 'login_required') {
                  openAuthModal();
                }
              }}
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

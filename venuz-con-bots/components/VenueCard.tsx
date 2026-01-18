'use client';

import { useState } from 'react';
import { Heart, MapPin, Star, Share2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import ImageCarousel from './ImageCarousel';
import LiveBadge from './ui/LiveBadge';
import HeatIndicator from './ui/HeatIndicator';
import { cn, formatDistance, getPriceLevel } from '@/lib/utils';

interface VenueCardProps {
    id: string;
    name: string;
    category: string;
    images: string[];
    rating?: number;
    reviewCount?: number;
    distance?: number;
    priceLevel?: number;
    isLive?: boolean;
    activity?: number;
    onClick?: () => void;
    className?: string;
}

export default function VenueCard({
    id,
    name,
    category,
    images,
    rating,
    reviewCount,
    distance,
    priceLevel,
    isLive = false,
    activity = 0,
    onClick,
    className
}: VenueCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);

    const handleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFavorite(!isFavorite);
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Implementar share logic
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({
                title: name,
                text: `Descubre ${name} en VENUZ`,
                url: window.location.href
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3 }}
            onClick={onClick}
            className={cn(
                "card-casino cursor-pointer group",
                className
            )}
        >
            {/* Image Section */}
            <div className="relative h-64 w-full overflow-hidden">
                <ImageCarousel
                    images={images}
                    alt={name}
                    className="h-full w-full"
                />

                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {isLive && <LiveBadge />}
                    <HeatIndicator activity={activity} />
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 right-3 z-10">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/50 backdrop-blur-sm text-white border border-white/20">
                        {category}
                    </span>
                </div>

                {/* Quick Actions */}
                <div className="absolute bottom-3 right-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleFavorite}
                        className="p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                    >
                        <Heart
                            className={cn(
                                "w-5 h-5",
                                isFavorite ? "fill-red-500 text-red-500 animate-heartbeat" : "text-white"
                            )}
                        />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleShare}
                        className="p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                    >
                        <Share2 className="w-5 h-5 text-white" />
                    </motion.button>
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Content Section */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <h3 className="font-display font-bold text-xl text-white line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-casino transition-all">
                    {name}
                </h3>

                {/* Meta Info */}
                <div className="flex items-center gap-3 text-sm flex-wrap">
                    {/* Rating */}
                    {rating && (
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-white">{rating.toFixed(1)}</span>
                            {reviewCount && (
                                <span className="text-gray-400">({reviewCount})</span>
                            )}
                        </div>
                    )}

                    {/* Distance */}
                    {distance !== undefined && (
                        <div className="flex items-center gap-1 text-gray-300">
                            <MapPin className="w-4 h-4" />
                            <span>{formatDistance(distance)}</span>
                        </div>
                    )}

                    {/* Price Level */}
                    {priceLevel && (
                        <span className="text-green-400 font-bold">
                            {getPriceLevel(priceLevel)}
                        </span>
                    )}
                </div>

                {/* CTA Button */}
                <button className="w-full btn-casino flex items-center justify-center gap-2 group/btn py-3 mt-4">
                    <span>Ver Detalles</span>
                    <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
}

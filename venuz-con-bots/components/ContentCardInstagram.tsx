
'use client';

import { motion } from 'framer-motion';
import { Heart, Bookmark, Share2, MapPin, Star } from 'lucide-react';
import { useInteractions } from '@/hooks/useInteractions';
import { useAuthContext } from '@/context/AuthContext';
import clsx from 'clsx';

interface ContentCardInstagramProps {
    content: any;
    index: number;
}

export function ContentCardInstagram({ content, index }: ContentCardInstagramProps) {
    const {
        isLiked,
        isSaved,
        likesCount,
        toggleLike,
        toggleSave
    } = useInteractions(content.id);
    const { openAuthModal } = useAuthContext();

    const handleToggleLike = async () => {
        const result = await toggleLike();
        if (result?.error === 'login_required') {
            openAuthModal();
        }
    };

    const handleToggleSave = async () => {
        const result = await toggleSave();
        if (result?.error === 'login_required') {
            openAuthModal();
        }
    };

    const getPriceSymbols = (level: number) => '💰'.repeat(level || 1);

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % 3) * 0.1 }}
            className="bg-zinc-900/50 rounded-3xl overflow-hidden border border-zinc-800/50 hover:border-venuz-pink/30 transition-all duration-500 group"
        >
            {/* IMAGEN CON BADGES OVERLAY */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={content.image_url || '/placeholder-venue.jpg'}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    alt={content.title}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                {/* Badges flotantes */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <Badge className="bg-venuz-pink/20 border-venuz-pink/40 text-venuz-pink backdrop-blur-md">
                        {content.category || 'PLACE'}
                    </Badge>
                    {content.active && (
                        <Badge className="bg-green-500/20 border-green-400/40 text-green-400 backdrop-blur-md">
                            🟢 ABIERTO
                        </Badge>
                    )}
                </div>

                <div className="absolute top-4 right-4">
                    <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-full px-3 py-1">
                        <span className="text-xs font-bold text-white">{getPriceSymbols(content.price_level)}</span>
                    </div>
                </div>

                {/* Rating overlay */}
                <div className="absolute bottom-4 left-4">
                    <div className="backdrop-blur-2xl bg-black/60 border border-amber-400/30 rounded-2xl px-3 py-1.5 flex items-center gap-1.5 shadow-xl">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-black text-white">{content.rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-[10px] text-zinc-400 font-bold">({(content.reviews_count || 0).toLocaleString()})</span>
                    </div>
                </div>
            </div>

            {/* CONTENT SECTION */}
            <div className="p-5 space-y-4">
                {/* Title */}
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-venuz-pink transition-colors">
                        {content.title}
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <MapPin className="w-3 h-3 text-venuz-pink" />
                        <span>{content.location_text || 'Puerto Vallarta'}</span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed font-medium">
                    {content.description}
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-4 pt-2">
                    <button
                        onClick={handleToggleLike}
                        className="flex items-center gap-1.5 group/btn"
                    >
                        <Heart className={clsx("w-6 h-6 transition-all", isLiked ? "fill-venuz-pink text-venuz-pink scale-110" : "text-zinc-500 group-hover/btn:text-venuz-pink")} />
                        <span className={clsx("text-xs font-black", isLiked ? "text-venuz-pink" : "text-zinc-500")}>{likesCount}</span>
                    </button>

                    <button onClick={handleToggleSave} className="flex items-center gap-1.5 group/btn">
                        <Bookmark className={clsx("w-6 h-6 transition-all", isSaved ? "fill-venuz-gold text-venuz-gold scale-110" : "text-zinc-500 group-hover/btn:text-venuz-gold")} />
                    </button>

                    <button className="flex items-center gap-1.5 group/btn">
                        <Share2 className="w-5 h-5 text-zinc-500 group-hover/btn:text-blue-400 transition-colors" />
                    </button>

                    {content.source_url && (
                        <a
                            href={content.source_url}
                            target="_blank"
                            className="ml-auto bg-white/5 hover:bg-venuz-pink/20 border border-white/10 hover:border-venuz-pink/40 px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
                        >
                            Ver Más
                        </a>
                    )}
                </div>
            </div>
        </motion.article>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={clsx("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", className)}>
            {children}
        </div>
    );
}

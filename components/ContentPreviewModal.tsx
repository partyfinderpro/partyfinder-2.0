'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    X,
    Heart,
    Share2,
    ExternalLink,
    MapPin,
    Clock,
    Eye,
    Star,
    BadgeCheck,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Users,
    ThumbsUp,
} from 'lucide-react';
import { useInteractions } from '@/hooks/useInteractions';
import { useSession } from '@/components/AuthProvider';
import { sanitizeImageUrl } from '@/lib/media';
import { VideoPlayer } from './ContentCard';

// ============================================
// VENUZ - Content Preview Modal (Interstitial)
// Estrategia híbrida recomendada por Grok
// ============================================

interface ContentItem {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    images?: string[]; // Múltiples imágenes para galería
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
    affiliate_source?: 'camsoda' | 'stripchat' | 'chaturbate' | 'other';
    views?: number;
    likes?: number;
    created_at?: string;
    tags?: string[];
    viewers_now?: number;
    source_url?: string;
}

interface ContentPreviewModalProps {
    content: ContentItem | null;
    isOpen: boolean;
    onClose: () => void;
    onLike?: (id: string) => void;
    onShare?: (id: string) => void;
    relatedContent?: ContentItem[];
}

// Placeholder images por categoría
const CATEGORY_PLACEHOLDERS: Record<string, string> = {
    escort: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
    modelo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
    club: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80',
    bar: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
    evento: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    concierto: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
    live: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    default: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80',
};

// Función para loguear eventos (preparado para Supabase)
const logEvent = async (eventType: string, contentId: string, metadata?: Record<string, unknown>) => {
    // TODO: Integrar con Supabase
    console.log('[VENUZ Analytics]', { eventType, contentId, metadata, timestamp: new Date().toISOString() });

    // Ejemplo de integración futura:
    // await supabase.from('analytics_events').insert({
    //   event_type: eventType,
    //   content_id: contentId,
    //   user_id: localStorage.getItem('venuz_user_id'),
    //   metadata,
    //   created_at: new Date().toISOString()
    // });
};

// Obtener nombre legible del source
const getSourceDisplayName = (source?: string, sourceUrl?: string): string => {
    if (sourceUrl) {
        try {
            return sourceUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        } catch (e) {
            // fallback
        }
    }

    const names: Record<string, string> = {
        camsoda: 'CamSoda',
        stripchat: 'Stripchat',
        chaturbate: 'Chaturbate',
        other: 'Sitio externo',
    };
    return names[source || 'other'] || source || 'Sitio externo';
};

export default function ContentPreViewModal({
    content,
    isOpen,
    onClose,
    onLike,
    onShare,
    relatedContent = [],
}: ContentPreviewModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showExitWarning, setShowExitWarning] = useState(false);
    const [imageError, setImageError] = useState(false);

    const session = useSession();
    const {
        liked,
        likesCount,
        toggleLike,
        registerView
    } = useInteractions({
        contentId: content?.id || '',
        userId: session?.user?.id,
        initialLikes: content?.likes || 0
    });

    // Reset state cuando cambia el contenido
    useEffect(() => {
        if (content) {
            setCurrentImageIndex(0);
            setShowExitWarning(false);
            setImageError(false);

            // Log de vista del modal y registro en DB
            registerView();
            logEvent('modal_view', content.id, {
                category: content.category,
                affiliate_source: content.affiliate_source,
            });
        }
    }, [content?.id, registerView]);

    // Cerrar con ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevenir scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!content) return null;

    const isAffiliate = Boolean(content.affiliate_url);
    const hasVideo = Boolean(content.video_url);

    // Preparar lista de medios (videos + imágenes)
    const mediaItems: { type: 'image' | 'video', url: string }[] = [];
    if (hasVideo && content.video_url) {
        mediaItems.push({ type: 'video', url: content.video_url });
    }

    const rawImages = content.images || [content.image_url || CATEGORY_PLACEHOLDERS[content.category] || CATEGORY_PLACEHOLDERS.default];
    rawImages.forEach(img => {
        mediaItems.push({ type: 'image', url: sanitizeImageUrl(img, content.affiliate_source, content.source_url) });
    });

    const currentMedia = mediaItems[currentImageIndex];

    const handleLike = () => {
        toggleLike();
        onLike?.(content.id);
        logEvent('like', content.id, { liked: !liked });
    };

    const handleShare = () => {
        onShare?.(content.id);
        logEvent('share', content.id);

        if (typeof navigator.share !== 'undefined') {
            navigator.share({
                title: content.title,
                text: content.description,
                url: window.location.href,
            }).catch(console.error);
        }
    };

    const handleVisitSite = () => {
        if (!content.id) return;

        // Log antes de salir
        logEvent('exit_click', content.id, {
            affiliate_source: content.affiliate_source,
            target_id: content.id,
        });

        // REDIRECT MANAGER: Abrir vía nuestro endpoint de redirección
        window.open(`/api/go?id=${content.id}`, '_blank', 'noopener,noreferrer');
        setShowExitWarning(false);
    };

    const handleExitButtonClick = () => {
        // Mostrar warning antes de salir
        setShowExitWarning(true);
        logEvent('exit_intent', content.id);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-4 sm:inset-8 md:inset-12 lg:inset-16 z-50 flex items-center justify-center"
                    >
                        <div className="relative w-full h-full max-w-6xl mx-auto bg-gradient-to-b from-gray-900 to-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Content Grid */}
                            <div className="h-full grid grid-cols-1 lg:grid-cols-2">

                                {/* Left: Media Gallery */}
                                <div className="relative h-64 sm:h-80 lg:h-full bg-black">
                                    {currentMedia.type === 'video' ? (
                                        <VideoPlayer
                                            src={currentMedia.url}
                                            thumbnail={content.thumbnail_url || content.image_url}
                                            isActive={isOpen}
                                            className="w-full h-full"
                                        />
                                    ) : (
                                        <img
                                            src={imageError ? CATEGORY_PLACEHOLDERS.default : currentMedia.url}
                                            alt={content.title}
                                            className="w-full h-full object-cover"
                                            onError={() => setImageError(true)}
                                            referrerPolicy="no-referrer"
                                        />
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                                    {/* Media Navigation */}
                                    {mediaItems.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>

                                            {/* Media Dots */}
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                                {mediaItems.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentImageIndex(idx)}
                                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex
                                                            ? 'bg-white w-6'
                                                            : 'bg-white/50 hover:bg-white/80'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Badges on Image */}
                                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                        {content.is_verified && (
                                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/80 backdrop-blur-sm text-white flex items-center gap-1">
                                                <BadgeCheck className="w-3.5 h-3.5" />
                                                Verificado
                                            </span>
                                        )}
                                        {content.is_premium && (
                                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-white flex items-center gap-1">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Premium
                                            </span>
                                        )}
                                        {content.viewers_now && (
                                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/80 backdrop-blur-sm text-white flex items-center gap-1 animate-pulse">
                                                <Users className="w-3.5 h-3.5" />
                                                {content.viewers_now.toLocaleString()} viendo
                                            </span>
                                        )}
                                    </div>

                                    {/* Affiliate Source Badge */}
                                    {(content.source_url || content.affiliate_source) && (
                                        <div className="absolute top-4 right-14">
                                            <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg">
                                                {getSourceDisplayName(content.affiliate_source, content.source_url)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Content Details */}
                                <div className="flex flex-col h-full overflow-y-auto p-6 lg:p-8">

                                    {/* Category */}
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-medium w-fit mb-4">
                                        {content.category}
                                        {content.subcategory && (
                                            <>
                                                <span className="text-white/30">•</span>
                                                {content.subcategory}
                                            </>
                                        )}
                                    </span>

                                    {/* Title */}
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                                        {content.title}
                                    </h2>

                                    {/* Description */}
                                    {content.description && (
                                        <p className="text-white/70 mb-6 leading-relaxed">
                                            {content.description}
                                        </p>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex flex-wrap gap-4 mb-6 text-sm text-white/60">
                                        {content.location && (
                                            <span className="flex items-center gap-1.5">
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
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                Hasta {content.open_until}
                                            </span>
                                        )}
                                        {content.rating && (
                                            <span className="flex items-center gap-1.5">
                                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                                {content.rating.toFixed(1)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-6 mb-6 py-4 border-y border-white/10">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-white">
                                                {(content.views || 0).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-white/50 flex items-center justify-center gap-1">
                                                <Eye className="w-3 h-3" /> Vistas
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-white">
                                                {likesCount.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-white/50 flex items-center justify-center gap-1">
                                                <ThumbsUp className="w-3 h-3" /> Likes
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {content.tags && content.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {content.tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 rounded-full bg-white/5 text-white/60 text-xs hover:bg-white/10 cursor-pointer transition-colors"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Spacer */}
                                    <div className="flex-1" />

                                    {/* Actions */}
                                    <div className="space-y-4 mt-6">
                                        {/* Like & Share */}
                                        <div className="flex gap-3">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleLike}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${liked
                                                    ? 'bg-pink-500 text-white'
                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                                    }`}
                                            >
                                                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                                                {liked ? 'Guardado' : 'Guardar'}
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleShare}
                                                className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                                            >
                                                <Share2 className="w-5 h-5" />
                                            </motion.button>
                                        </div>

                                        {/* Visit Site Button (for affiliates) */}
                                        {isAffiliate && (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleExitButtonClick}
                                                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white font-bold text-lg shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all"
                                            >
                                                Visitar {getSourceDisplayName(content.affiliate_source, content.source_url)}
                                                <ExternalLink className="w-5 h-5" />
                                            </motion.button>
                                        )}
                                    </div>

                                    {/* Related Content */}
                                    {relatedContent.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-white/10">
                                            <h3 className="text-lg font-semibold text-white mb-4">
                                                Otras que te pueden gustar
                                            </h3>
                                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                                {relatedContent.slice(0, 5).map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex-shrink-0 w-24 cursor-pointer group"
                                                    >
                                                        <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                                                            <Image
                                                                src={item.image_url || CATEGORY_PLACEHOLDERS.default}
                                                                alt={item.title}
                                                                fill
                                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-white/70 truncate">
                                                            {item.title}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Exit Warning Modal */}
                    <AnimatePresence>
                        {showExitWarning && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                            >
                                <div
                                    className="absolute inset-0 bg-black/80"
                                    onClick={() => setShowExitWarning(false)}
                                />
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="relative z-10 max-w-md w-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 border border-white/10"
                                >
                                    <div className="flex items-center gap-3 mb-4 text-amber-400">
                                        <AlertTriangle className="w-6 h-6" />
                                        <h3 className="text-xl font-bold text-white">
                                            Saliendo de VENUZ
                                        </h3>
                                    </div>

                                    <p className="text-white/70 mb-6">
                                        Estás a punto de visitar <strong className="text-white">{getSourceDisplayName(content.affiliate_source, content.source_url)}</strong>.
                                        Este es un sitio externo con contenido para adultos (+18).
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowExitWarning(false)}
                                            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleVisitSite}
                                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold flex items-center justify-center gap-2"
                                        >
                                            Continuar
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}

export { ContentPreViewModal };

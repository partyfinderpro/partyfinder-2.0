'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useFeed, useInfiniteScroll, useTrackInteraction } from '@/lib/hooks/useFeed';
import { useFeedMixer } from '@/hooks/useFeedMixer';
import type { ContentItem } from '@/lib/feedAlgorithm';
import { LikeButton } from '@/components/ui/LikeButton';

// ============================================
// FEED PRINCIPAL - Estilo TikTok/VENUZ
// ============================================
export default function FeedPage() {
    const [feedType, setFeedType] = useState<'trending' | 'webcams' | 'clubs' | 'nearby'>('trending');
    const { items: rawItems, loading, error, hasMore, loadMore, refresh } = useFeed({ type: feedType });
    const triggerRef = useInfiniteScroll(loadMore, hasMore, loading);

    // 🛣️ THE HIGHWAY: Chameleon Feed Logic
    const { feed: mixedItems, handleLike } = useFeedMixer(rawItems);

    // Use mixed items for display, fallback to raw if mixer hasn't initialized (shouldn't happen but safety first)
    const displayItems = mixedItems.length > 0 ? mixedItems : rawItems;

    return (
        <div className="min-h-screen bg-black">
            {/* Header con tabs */}
            <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-pink-500/20">
                <div className="flex items-center justify-between px-4 py-3">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        VENUZ
                    </h1>
                    <button onClick={refresh} className="text-pink-500 text-sm">
                        🔄 Refresh
                    </button>
                </div>
                <nav className="flex justify-center gap-2 px-4 pb-3 overflow-x-auto">
                    {(['trending', 'webcams', 'clubs', 'nearby'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFeedType(tab)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${feedType === tab
                                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                        >
                            {tab === 'trending' ? '🔥 Trending' :
                                tab === 'webcams' ? '📹 Webcams' :
                                    tab === 'clubs' ? '🎭 Clubs' : '📍 Cerca'}
                        </button>
                    ))}
                </nav>
            </header>

            {/* Error state */}
            {error && (
                <div className="p-4 m-4 bg-red-900/50 border border-red-500 rounded-lg text-center">
                    <p className="text-red-300">{error}</p>
                    <button
                        onClick={refresh}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Feed */}
            <main className="pb-20">
                {/* Mobile: Full screen cards */}
                <div className="lg:hidden snap-y snap-mandatory overflow-y-auto h-[calc(100vh-120px)]">
                    {displayItems.map((item, index) => (
                        <FeedCardMobile
                            key={item.id}
                            item={item as ContentItem}
                            index={index}
                            onLikeAction={handleLike}
                        />
                    ))}
                </div>

                {/* Desktop: Grid */}
                <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4">
                    {displayItems.map((item) => (
                        <FeedCardDesktop
                            key={item.id}
                            item={item as ContentItem}
                            onLikeAction={handleLike}
                        />
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent" />
                    </div>
                )}

                {/* Infinite scroll trigger */}
                <div ref={triggerRef} className="h-4" />

                {/* No more content */}
                {!hasMore && displayItems.length > 0 && (
                    <p className="text-center text-gray-500 py-8">
                        No hay más contenido 🎭
                    </p>
                )}
            </main>
        </div>
    );
}

// ============================================
// CARD MOBILE - Estilo TikTok
// ============================================
function FeedCardMobile({ item, index, onLikeAction }: { item: ContentItem; index: number; onLikeAction: any }) {
    const { trackLike } = useTrackInteraction();

    // Handler combinado
    const handleLike = (id: string, category: string, isNSFW: boolean) => {
        trackLike(id); // Tracking original
        onLikeAction(id, category, isNSFW); // The Highway Logic
    };

    // Sanitize image URL
    const imageUrl = item.image_url?.includes('googleapis.com')
        ? 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800'
        : item.image_url;

    return (
        <div className="relative h-screen w-full snap-start">
            {/* Background */}
            <div className="absolute inset-0">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />
            </div>

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-16 p-4 pb-24">
                {/* Badges */}
                <div className="flex gap-2 mb-2">
                    {item.is_premium && (
                        <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded text-xs font-bold text-black">
                            ⭐ PREMIUM
                        </span>
                    )}
                    {item.is_verified && (
                        <span className="px-2 py-1 bg-green-500 rounded text-xs font-bold text-white">
                            ✓ VERIFICADO
                        </span>
                    )}
                    <span className="px-2 py-1 bg-pink-500/80 rounded text-xs font-bold text-white uppercase">
                        {item.category || 'general'}
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-1 line-clamp-2">
                    {item.title}
                </h2>

                {/* Description */}
                {item.description && (
                    <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                        {item.description}
                    </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                    {item.location && (
                        <span className="flex items-center gap-1">📍 {item.location}</span>
                    )}
                    {item.affiliate_source && (
                        <span className="flex items-center gap-1">🔗 {item.affiliate_source}</span>
                    )}
                </div>

                {/* CTA */}
                {item.affiliate_url && (
                    <a
                        href={item.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white font-bold text-sm shadow-lg shadow-pink-500/30"
                    >
                        Ver más →
                    </a>
                )}
            </div>

            {/* Action buttons - right side */}
            <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
                <LikeButton
                    contentId={item.id}
                    category={item.category || 'general'}
                    initialCount={item.likes}
                    isNSFW={item.category === 'escort' || item.category === 'webcam' || item.affiliate_source === 'Reddit'}
                    onLike={handleLike}
                    size="lg"
                />

                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <span className="text-2xl">👁️</span>
                    </div>
                    <span className="text-white text-xs mt-1">{item.views}</span>
                </div>

                <button className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <span className="text-2xl">↗️</span>
                    </div>
                    <span className="text-white text-xs mt-1">Share</span>
                </button>
            </div>
        </div>
    );
}

// ============================================
// CARD DESKTOP - Estilo Casino/Neon
// ============================================
function FeedCardDesktop({ item, onLikeAction }: { item: ContentItem; onLikeAction: any }) {
    const { trackLike } = useTrackInteraction();

    const handleLike = (id: string, category: string, isNSFW: boolean) => {
        trackLike(id);
        onLikeAction(id, category, isNSFW);
    };

    const imageUrl = item.image_url?.includes('googleapis.com')
        ? 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800'
        : item.image_url;

    return (
        <div className="group relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-pink-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]">
            {/* Image */}
            <div className="aspect-[3/4] relative overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
                        <span className="text-6xl opacity-30">🎭</span>
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-1">
                    {item.is_premium && (
                        <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                            ⭐
                        </span>
                    )}
                    <span className="px-2 py-1 bg-pink-500 text-white text-xs font-bold rounded uppercase">
                        {item.category || 'general'}
                    </span>
                </div>

                {/* Like button */}
                <div className="absolute top-3 right-3">
                    <LikeButton
                        contentId={item.id}
                        category={item.category || 'general'}
                        initialCount={item.likes}
                        isNSFW={item.category === 'escort' || item.category === 'webcam' || item.affiliate_source === 'Reddit'}
                        onLike={handleLike}
                        size="md"
                        showCount={false}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-white text-lg mb-1 line-clamp-1">
                    {item.title}
                </h3>

                {item.description && (
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                        {item.description}
                    </p>
                )}

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-gray-500">
                        {/* We use the internal count of LikeButton, so we don't need to duplicate display here unless desired */}
                        <span>Like it! 👆</span>
                        <span>👁️ {item.views}</span>
                    </div>

                    {item.affiliate_source && (
                        <span className="text-gray-500 text-xs">
                            🔗 {item.affiliate_source}
                        </span>
                    )}
                </div>

                {item.affiliate_url && (
                    <a
                        href={item.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 block w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white text-center font-medium text-sm hover:shadow-lg hover:shadow-pink-500/30 transition-shadow"
                    >
                        Ver más →
                    </a>
                )}
            </div>
        </div>
    );
}

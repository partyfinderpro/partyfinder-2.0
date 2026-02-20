'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from 'next/dynamic';
import { useAdaptiveFeed } from "@/hooks/useAdaptiveFeed";
import { useDevice } from "@/hooks/useDevice";
import { filterByMode, type FeedMode } from "@/components/FeedTabs";
import { supabase } from '@/lib/supabase';
import { Loader2, MapPin, Flame, Sparkles, Heart } from "lucide-react";
import AffiliateAdCard from '@/components/AffiliateAdCard';
import type { ContentItem } from "@/hooks/useContent";
import { type FilterOptions } from '@/components/AdvancedFiltersModal';

// Dynamic import for FeedCard to improve initial load
const FeedCardDynamic = dynamic(() => import('@/components/FeedCardDynamic'), { ssr: false });

interface FeedProps {
    activeMenu: string;
    searchQuery: string;
    selectedCategory: string;
    selectedCity: string;
    lat: number | null;
    lng: number | null;
    filterOptions: FilterOptions;
    feedMode: FeedMode;
    onContentClick: (item: ContentItem) => void;
    onShare: (id: string) => void;
    onCityChange: (city: string) => void;
    detectLocation: () => void;
    setManualCity: (city: string) => void;
    locLoading: boolean;
    locError: string | null;
    setActiveMenu: (menu: string) => void;
    handleCategorySelect: (id: string) => void;
}

export default function Feed({
    activeMenu,
    searchQuery,
    selectedCategory,
    selectedCity,
    lat,
    lng,
    filterOptions,
    feedMode,
    onContentClick,
    onShare,
    onCityChange,
    detectLocation,
    setManualCity,
    locLoading,
    locError,
    setActiveMenu,
    handleCategorySelect
}: FeedProps) {

    // Refs
    const feedRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // UI State
    const [activeIndex, setActiveIndex] = useState(0);

    // Hook for Feed Data
    const {
        content,
        isLoading,
        error,
        hasMore,
        loadMore,
        refresh,
        isHighwayActive,
    } = useAdaptiveFeed({
        category: selectedCategory || undefined,
        mode: activeMenu,
        search: searchQuery,
        city: selectedCity,
        limit: 20,
        latitude: lat,
        longitude: lng,
        radius: filterOptions.radius,
        priceMin: filterOptions.priceRange[0],
        priceMax: filterOptions.priceRange[1] < 4 ? filterOptions.priceRange[1] : undefined,
        verifiedOnly: filterOptions.verifiedOnly,
        openNow: filterOptions.openNow
    });

    // Filter content by mode
    const filteredContent = useMemo(() => filterByMode(content, feedMode), [content, feedMode]);

    // Affiliate Ads State
    const [affiliateAds, setAffiliateAds] = useState<any[]>([]);

    useEffect(() => {
        const loadAds = async () => {
            try {
                const { data } = await supabase
                    .from('affiliate_links')
                    .select('*')
                    .eq('is_active', true)
                    .order('priority', { ascending: false });

                if (data) setAffiliateAds(data);
            } catch (err) {
                console.error('Error loading ads:', err);
            }
        };
        loadAds();
    }, []);

    // Mix content with ads
    const mixedFeed = useMemo(() => {
        if (affiliateAds.length === 0) return filteredContent;

        const mixed: any[] = [];
        let adIndex = 0;

        filteredContent.forEach((item, index) => {
            mixed.push({ ...item, type: 'content' });
            // Inject ad every 6 items
            if ((index + 1) % 6 === 0) {
                const ad = affiliateAds[adIndex % affiliateAds.length];
                mixed.push({ ...ad, type: 'ad', id: `ad-${ad.id}-${index}` });
                adIndex++;
            }
        });

        return mixed;
    }, [filteredContent, affiliateAds]);

    // Intersection Observer
    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.getAttribute("data-index") || "0");
                        setActiveIndex(index);
                    }
                });
            },
            {
                root: null,
                rootMargin: "-40% 0px -40% 0px",
                threshold: 0.5,
            }
        );

        const infiniteObserver = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    console.log('[VENUZ] Loading more content...');
                    loadMore();
                }
            },
            {
                root: null,
                threshold: 0.1,
                rootMargin: '400px'
            }
        );

        const trigger = document.getElementById('infinite-trigger');
        if (trigger) {
            infiniteObserver.observe(trigger);
        }

        return () => {
            observerRef.current?.disconnect();
            infiniteObserver.disconnect();
        };
    }, [hasMore, isLoading, loadMore, content.length]);

    return (
        <>
            {/* Location Indicator - Only visible in "Near me" mode */}
            {activeMenu === 'cerca' && (
                <div className="mb-6 p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${lat && lng ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                            <MapPin className={`w-5 h-5 ${lat && lng ? 'text-green-400' : 'text-amber-400'}`} />
                        </div>
                        <div>
                            <p className="text-white font-medium text-sm">
                                {lat && lng
                                    ? `📍 ${selectedCity !== 'Todas' && selectedCity !== 'Ubicación Actual' ? selectedCity : 'Tu ubicación'}`
                                    : '📍 Ubicación no detectada'
                                }
                            </p>
                            <p className="text-gray-400 text-xs">
                                {lat && lng
                                    ? `Radio: 50km · ${filteredContent.length} lugares encontrados`
                                    : selectedCity !== 'Todas' ? `Buscando en: ${selectedCity}` : 'Activa GPS para mejores resultados'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {!lat && (
                            <button
                                onClick={() => detectLocation()}
                                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs transition flex items-center gap-1"
                            >
                                <MapPin className="w-3 h-3" />
                                Activar GPS
                            </button>
                        )}
                        <button
                            onClick={() => setManualCity('Todas')}
                            className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg text-xs transition"
                        >
                            Ver todo
                        </button>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                    <p className="font-bold mb-1">⚠️ Error detectado:</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Content Feed */}
            <div
                ref={feedRef}
                className="
          relative
          lg:h-auto
          h-[calc(100vh-180px)]
          overflow-y-auto
          snap-y snap-mandatory lg:snap-none
          lg:space-y-6
        "
            >
                {isLoading && content.length === 0 ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="venuz-card h-[500px] skeleton" />
                        ))}
                    </div>
                ) : mixedFeed.length === 0 ? (
                    <div className="text-center py-20 venuz-card">
                        {activeMenu === 'favoritos' ? (
                            <>
                                <Heart className="w-16 h-16 text-venuz-pink mx-auto mb-4" />
                                <p className="text-2xl text-gray-400 mb-2">No tienes favoritos aún</p>
                                <p className="text-gray-500 mb-6">Dale ❤️ a lo que te gusta y aparecerá aquí</p>
                                <button onClick={() => setActiveMenu('inicio')} className="venuz-button">Explorar contenido</button>
                            </>
                        ) : activeMenu === 'cerca' ? (
                            <>
                                <MapPin className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                                <p className="text-2xl text-gray-400 mb-2">No hay contenido cerca de ti</p>
                                <div className="bg-gray-800/50 rounded-lg px-4 py-3 mb-4 inline-block">
                                    {locLoading ? (
                                        <p className="text-gray-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Detectando tu ubicación...</p>
                                    ) : locError ? (
                                        <p className="text-amber-400 text-sm flex items-center gap-2">⚠️ {locError}</p>
                                    ) : (
                                        <p className="text-gray-500 text-sm">
                                            {selectedCity === 'Todas' ? 'Selecciona una ciudad o activa tu ubicación' : `Buscando en: ${selectedCity}`}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {!lat && <button onClick={() => detectLocation()} className="venuz-button">📍 Activar GPS</button>}
                                    <button onClick={() => setManualCity('CDMX')} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm">🏙️ Ver CDMX</button>
                                    <button onClick={() => setActiveMenu('inicio')} className="px-4 py-2 bg-venuz-pink/20 text-venuz-pink rounded-lg hover:bg-venuz-pink/30 transition text-sm">Ver todo</button>
                                </div>
                            </>
                        ) : activeMenu === 'tendencias' ? (
                            <>
                                <Flame className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                                <p className="text-2xl text-gray-400 mb-2">Sin tendencias esta semana</p>
                                <button onClick={() => setActiveMenu('inicio')} className="venuz-button">Ver todo el contenido</button>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-16 h-16 text-venuz-pink mx-auto mb-4" />
                                <p className="text-2xl text-gray-500 mb-4">No hay contenido en esta categoría</p>
                                <button onClick={() => handleCategorySelect('')} className="venuz-button">Ver todo</button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {mixedFeed.map((item, index) => (
                            <article
                                key={item.id}
                                data-index={index}
                                ref={(el) => { if (el && observerRef.current) observerRef.current.observe(el); }}
                                className="venuz-card group overflow-hidden snap-center lg:snap-align-none"
                            >
                                {item.type === 'ad' ? (
                                    <AffiliateAdCard {...item} url={`/api/go?id=${item.id.replace('ad-', '').split('-')[0]}`} />
                                ) : (
                                    <>
                                        <div className="hidden lg:block w-full">
                                            <FeedCardDynamic
                                                item={item}
                                                isActive={activeIndex === index}
                                                onClick={() => onContentClick(item)}
                                                onShare={onShare}
                                                className="max-w-md mx-auto shadow-2xl hover:shadow-venuz-pink/20 transition-shadow duration-300"
                                            />
                                        </div>
                                        <div className="lg:hidden">
                                            <FeedCardDynamic
                                                item={item}
                                                isActive={activeIndex === index}
                                                onClick={() => onContentClick(item)}
                                                onShare={onShare}
                                                className="h-[calc(100vh-140px)] w-full rounded-xl"
                                            />
                                        </div>
                                    </>
                                )}
                            </article>
                        ))}

                        {/* Feed Progress Indicator (Mobile) */}
                        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 lg:hidden flex flex-col gap-2">
                            {filteredContent.slice(0, 8).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        const cards = feedRef.current?.querySelectorAll("[data-index]");
                                        cards?.[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
                                    }}
                                    className={`w-2 h-6 rounded-full transition-all duration-300 ${activeIndex === index ? "bg-gradient-to-b from-venuz-pink to-venuz-red scale-110" : "bg-white/20 hover:bg-white/40"}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

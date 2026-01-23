'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdaptiveFeatures } from '@/hooks/useNetworkStatus';
import { Loader2, WifiOff, AlertTriangle } from 'lucide-react';

// ============================================
// VENUZ - InfiniteScrollFeed Optimizado
// Con virtualización y adaptación a red
// ============================================

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  category: string;
  [key: string]: any;
}

interface InfiniteScrollFeedProps {
  initialData: ContentItem[];
  fetchMore: (offset: number) => Promise<ContentItem[]>;
  renderItem: (item: ContentItem, index: number, isActive: boolean) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  className?: string;
}

// Skeleton loader para items
function ItemSkeleton() {
  return (
    <div className="w-full aspect-[9/16] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse">
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        <div className="h-6 bg-gray-700 rounded-lg w-3/4" />
        <div className="h-4 bg-gray-700 rounded-lg w-1/2" />
        <div className="flex gap-2 mt-4">
          <div className="h-10 w-20 bg-gray-700 rounded-xl" />
          <div className="h-10 w-10 bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Indicador de conexión lenta
function SlowConnectionBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 left-4 right-4 z-40 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 text-amber-400 text-sm">
        <AlertTriangle className="w-4 h-4" />
        <span>Conexión lenta detectada. Reduciendo calidad para mejor experiencia.</span>
      </div>
    </motion.div>
  );
}

// Indicador offline
function OfflineBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 left-4 right-4 z-40 p-3 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <WifiOff className="w-4 h-4" />
        <span>Sin conexión. Mostrando contenido guardado.</span>
      </div>
    </motion.div>
  );
}

export function InfiniteScrollFeed({
  initialData,
  fetchMore,
  renderItem,
  itemHeight = 600,
  overscan = 3,
  className = "",
}: InfiniteScrollFeedProps) {
  const [items, setItems] = useState<ContentItem[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const {
    enableAnimations,
    enablePrefetch,
    prefetchCount,
    showSlowConnectionWarning,
    isOffline,
  } = useAdaptiveFeatures();

  // Cargar más items
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || isOffline) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await fetchMore(items.length);
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }
    } catch (err) {
      setError('Error al cargar más contenido');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, isOffline, items.length, fetchMore]);

  // Prefetch cuando se acerca al final
  const handleRangeChanged = useCallback(({ endIndex }: { startIndex: number; endIndex: number }) => {
    // Actualizar índice activo
    const midpoint = Math.floor((endIndex) / 2);
    setActiveIndex(midpoint);

    // Prefetch si está cerca del final
    if (enablePrefetch && endIndex >= items.length - prefetchCount) {
      loadMore();
    }
  }, [enablePrefetch, items.length, prefetchCount, loadMore]);

  // Scroll al item específico
  const scrollToIndex = useCallback((index: number) => {
    virtuosoRef.current?.scrollToIndex({
      index,
      align: 'center',
      behavior: enableAnimations ? 'smooth' : 'auto',
    });
  }, [enableAnimations]);

  // Footer con loader o mensaje de fin
  const Footer = useCallback(() => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center py-8 gap-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={loadMore}
            className="px-4 py-2 rounded-xl bg-pink-500/20 text-pink-400 text-sm hover:bg-pink-500/30 transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }

    if (!hasMore) {
      return (
        <div className="flex justify-center py-8">
          <p className="text-white/40 text-sm">Has llegado al final 🎉</p>
        </div>
      );
    }

    return null;
  }, [loading, error, hasMore, loadMore]);

  // Empty state
  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No hay contenido</h3>
        <p className="text-white/50">Intenta con otros filtros</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Banners de estado de red */}
      <AnimatePresence>
        {isOffline && <OfflineBanner />}
        {showSlowConnectionWarning && !isOffline && <SlowConnectionBanner />}
      </AnimatePresence>

      {/* Feed virtualizado */}
      <Virtuoso
        ref={virtuosoRef}
        data={items}
        overscan={overscan}
        rangeChanged={handleRangeChanged}
        endReached={loadMore}
        className="h-[calc(100vh-180px)] scrollbar-hide"
        itemContent={(index, item) => (
          <div 
            className="px-4 py-3"
            style={{ minHeight: itemHeight }}
          >
            {renderItem(item, index, index === activeIndex)}
          </div>
        )}
        components={{
          Footer,
          // Skeleton mientras carga el item
          ScrollSeekPlaceholder: () => (
            <div className="px-4 py-3">
              <ItemSkeleton />
            </div>
          ),
        }}
        scrollSeekConfiguration={{
          enter: (velocity) => Math.abs(velocity) > 1000,
          exit: (velocity) => Math.abs(velocity) < 100,
        }}
      />

      {/* Progress indicator lateral */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-1.5">
        {items.slice(0, 10).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`
              w-1.5 h-6 rounded-full transition-all duration-300
              ${activeIndex === index
                ? "bg-gradient-to-b from-pink-500 to-rose-500 scale-110"
                : "bg-white/20 hover:bg-white/40"
              }
            `}
            aria-label={`Ir al item ${index + 1}`}
          />
        ))}
        {items.length > 10 && (
          <span className="text-white/30 text-xs mt-1">+{items.length - 10}</span>
        )}
      </div>
    </div>
  );
}

export default InfiniteScrollFeed;

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import ContentCard, { VideoPlayer, MemoizedContentCard } from "@/components/ContentCard";
import FeedCardDynamic from "@/components/FeedCardDynamic";
// import ContentCardDesktop from '@/components/ContentCardDesktop'; // Removed legacy
import Image from "next/image";
import ContentPreviewModal from "@/components/ContentPreviewModal";
import AdvancedFiltersModal, { FilterOptions } from '@/components/AdvancedFiltersModal';
import MegaMenu from "@/components/MegaMenu";
import { useAdaptiveFeed } from "@/hooks/useAdaptiveFeed";
import type { ContentItem } from "@/hooks/useContent";
import { sanitizeImageUrl } from "@/lib/media";
import {
  ConcertIcon,
  BarIcon,
  ClubIcon,
  SolteroIcon,
  PartyIcon,
  LiveIcon,
  getCategoryIcon
} from "@/components/icons/CategoryIcons";
import { useDevice } from "@/hooks/useDevice";
import {
  Filter,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  Loader2,
  Home,
  Flame,
  Star,
  TrendingUp,
  Eye,
  Heart
} from "lucide-react";
import { TopRatedSidebar, exampleTopRatedItems } from "@/components/TopRatedSidebar";
import { TrustSignalsBanner } from "@/components/TrustSignalsBanner";
import { FeedTabs, filterByMode, type FeedMode } from "@/components/FeedTabs";
import { AlgorithmBadge } from "@/components/AlgorithmBadge";
import { LuxuryCard, LuxuryTitle, LuxuryButton } from "@/components/ui/LuxuryUI"; // VIP Components

// ============================================
// VENUZ - Página Principal HÍBRIDA
// Desktop: Layout Neon/Casino 3 columnas
// Mobile: Layout TikTok scroll infinito
// ============================================

interface Category {
  id: string;
  name: string;
  description?: string;
  isTemporary?: boolean;
}

// Categorías con iconos premium
const CATEGORIES: Category[] = [
  { id: "soltero", name: "Estoy Soltero", description: "Acompañantes verificadas" },
  { id: "webcam", name: "Webcams", description: "Streams y cams en vivo" },
  { id: "club", name: "Clubs", description: "Discotecas y antros" },
  { id: "bar", name: "Bares", description: "Nightlife" },
  { id: "tabledance", name: "Table Dance", description: "Shows en vivo" },
  { id: "evento", name: "Eventos", description: "Fiestas y reuniones", isTemporary: true },
  { id: "masaje", name: "Masajes", description: "Spa y relajación" },
  { id: "restaurante", name: "Restaurantes", description: "Gastronomía" },
  { id: "beach", name: "Beach Clubs", description: "Playa y fiesta" },
  { id: "hookup", name: "Hookups", description: "Citas rápidas" },
  { id: "ai-porn", name: "IA Art", description: "Contenido generado por IA" },
];

// Trending tags para sidebar
const TRENDING_TAGS = [
  '#VallartaNights',
  '#ZonaRomantica',
  '#PVClubs',
  '#NightlifePV',
  '#VallartaParty',
  '#MexicoNocturno'
];

// El sanitizeImageUrl ahora se importa de @/lib/media

import { useSmartLocation } from "@/hooks/useSmartLocation"; // Import nueva hook

export default function HomePage() {
  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState('inicio');
  const [searchQuery, setSearchQuery] = useState("");
  // const [selectedCity, setSelectedCity] = useState("Todas"); // Reemplazado por SmartLocation

  // Filter State
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    radius: 50,
    priceRange: [1, 4],
    verifiedOnly: false,
    openNow: false,
    hasVideo: false
  });

  // 🚀 Smart Location Hook
  const { city: selectedCity, lat, lng, detectLocation, setManualCity, isLoading: locLoading, error: locError } = useSmartLocation();

  const {
    content,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
    // Highway Algorithm extras
    isHighwayActive,
    intentScore,
    abVariant,
  } = useAdaptiveFeed({
    category: selectedCategory || undefined,
    mode: activeMenu,
    search: searchQuery,
    city: selectedCity,
    limit: 20,
    // Pass coordinates specifically for geo-queries
    latitude: lat,
    longitude: lng,
    radius: filterOptions.radius,
    // Advanced params
    priceMin: filterOptions.priceRange[0],
    priceMax: filterOptions.priceRange[1] < 4 ? filterOptions.priceRange[1] : undefined,
    verifiedOnly: filterOptions.verifiedOnly,
    openNow: filterOptions.openNow
  });

  // Centralized Device Detection
  const { isMobile, isDesktop } = useDevice();

  // UI State
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [notificationCount, setNotificationCount] = useState(5);
  const [ageVerified, setAgeVerified] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [feedMode, setFeedMode] = useState<FeedMode>('all');

  // Modal state para interstitial
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refs
  const feedRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Forzamos verificación automática para evitar bloqueos según reporte de usuario
    setAgeVerified(true)
    setShowSplash(false)

    if (!localStorage.getItem('venuz_user_id')) {

      localStorage.setItem('venuz_user_id', `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }

    // Cargar ciudad guardada
    // const storedCity = localStorage.getItem('venuz_user_city');
    // if (storedCity) setSelectedCity(storedCity); // Handle by useSmartLocation
  }, [])

  const handleAgeVerification = (verified: boolean) => {
    if (verified) {
      localStorage.setItem('venuz_age_verified', 'true')
      setAgeVerified(true)
    } else {
      window.location.href = 'https://www.google.com'
    }
  }

  // 🔥 Filtrar contenido por modo (Nightlife vs Adult)
  const filteredContent = filterByMode(content, feedMode);

  // Intersection Observer para detectar card activo
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

    // Infinite Scroll Observer
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
  }, [hasMore, isLoading, loadMore, content.length]); // Agregado content.length para re-observar

  // Handlers
  const handleLike = useCallback((id: string) => {
    console.log('[VENUZ] Like:', id);
  }, []);

  const handleShare = useCallback((id: string) => {
    const item = content.find(c => c.id === id);
    if (item && typeof navigator.share !== 'undefined') {
      navigator.share({
        title: item.title,
        text: item.description,
        url: window.location.href,
      }).catch(console.error);
    }
  }, [content]);

  const handleContentClick = useCallback((id: string) => {
    const item = content.find(c => c.id === id);
    if (item) {
      setSelectedContent(item);
      setIsModalOpen(true);
    }
  }, [content]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedContent(null);
  }, []);

  const getRelatedContent = useCallback((currentItem: ContentItem | null) => {
    if (!currentItem) return [];
    return content
      .filter(item =>
        item.id !== currentItem.id &&
        (item.category === currentItem.category || item.affiliate_source === currentItem.affiliate_source)
      )
      .slice(0, 5);
  }, [content]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId) setActiveMenu('inicio');
    setActiveIndex(0);
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCityChange = (city: string) => {
    if (city === 'Ubicación Actual') {
      detectLocation();
    } else {
      setManualCity(city);
    }
    setActiveIndex(0);
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveIndex(0);
  };

  // Calcular estadísticas
  const stats = {
    total: content.length,
    live: content.filter(c => c.category === 'live').length,
    featured: content.filter(c => c.is_premium).length,
    views: content.reduce((acc, c) => acc + (c.views || 0), 0)
  };

  // ==========================================
  // SPLASH SCREEN
  // ==========================================
  if (showSplash) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-7xl md:text-9xl font-display font-bold text-gradient glow-strong mb-4">
            VENUZ
          </h1>
          <p className="text-venuz-pink text-xl md:text-2xl font-semibold">
            Tu mundo de entretenimiento
          </p>
        </motion.div>
      </div>
    )
  }

  // Bloque de verificación de edad removido para fluidez (Urgente)


  // ==========================================
  // MAIN LAYOUT - RESPONSIVE HÃ BRIDO
  // ==========================================
  // ==========================================
  // MAIN LAYOUT - RESPONSIVE HÍBRIDO (CASINO MODE)
  // ==========================================
  return (
    <div className="min-h-screen bg-transparent"> {/* Transparente para ver el video */}
      <Header
        notificationCount={notificationCount}
        onSearch={handleSearch}
        onCityChange={handleCityChange}
        onRefresh={() => {
          console.log("Refrescando feed...");
          window.location.reload(); // Hard reload asegurado para limpiar PWA cache si es necesario, o usar refresh() del hook
        }}
      />

      {/* Highway Algorithm Debug Indicator - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && isHighwayActive && (
        <div className="fixed top-20 right-4 z-50 px-3 py-2 bg-gradient-to-r from-venuz-pink/20 to-purple-500/20 backdrop-blur-sm border border-venuz-pink/30 text-white text-xs rounded-lg shadow-lg">
          <div className="font-bold text-venuz-pink">🛣️ Highway Active</div>
          <div className="text-gray-300">Variant: {abVariant}</div>
          <div className="text-gray-300">Intent: {(intentScore * 100).toFixed(0)}%</div>
        </div>
      )}

      {/* ====================================
          MAIN CONTENT AREA
          ==================================== */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">

          {/* ====================================
              SIDEBAR IZQUIERDO - Solo Desktop (lg+)
              MenÃº + CategorÃ­as (Estilo Casino/Neon)
              ==================================== */}
          <aside className="hidden lg:block col-span-2 xl:col-span-2">
            <div className="sticky top-24 space-y-4">

              {/* Menú Principal */}
              <div className="bg-vip-black/40 backdrop-blur-md border border-vip-gold/20 rounded-xl p-4">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveMenu('inicio');
                      setSelectedCategory('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm flex items-center gap-3 ${activeMenu === 'inicio' && !selectedCategory
                      ? 'text-white bg-venuz-pink/20 border border-venuz-pink/30'
                      : 'text-gray-400 hover:bg-venuz-gray hover:text-white'
                      }`}
                  >
                    <Home className="w-4 h-4" />
                    Inicio
                  </button>
                  <button
                    onClick={() => {
                      setActiveMenu('tendencias');
                      setSelectedCategory('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm flex items-center gap-3 ${activeMenu === 'tendencias'
                      ? 'text-white bg-venuz-pink/20 border border-venuz-pink/30'
                      : 'text-gray-400 hover:bg-venuz-gray hover:text-white'
                      }`}
                  >
                    <Flame className="w-4 h-4 text-orange-400" />
                    Tendencias
                  </button>
                  <button
                    onClick={() => {
                      setActiveMenu('cerca');
                      setSelectedCategory('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm flex items-center gap-3 ${activeMenu === 'cerca'
                      ? 'text-white bg-venuz-pink/20 border border-venuz-pink/30'
                      : 'text-gray-400 hover:bg-venuz-gray hover:text-white'
                      }`}
                  >
                    <MapPin className="w-4 h-4 text-blue-400" />
                    Cerca de mí
                  </button>
                  <button
                    onClick={() => {
                      setActiveMenu('favoritos');
                      setSelectedCategory('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm flex items-center gap-3 ${activeMenu === 'favoritos'
                      ? 'text-white bg-venuz-pink/20 border border-venuz-pink/30'
                      : 'text-gray-400 hover:bg-venuz-gray hover:text-white'
                      }`}
                  >
                    <Heart className="w-4 h-4 text-pink-500" />
                    Favoritos
                  </button>
                </div>
              </div>

              {/* Categorías */}
              <div className="bg-vip-black/40 backdrop-blur-md border border-vip-gold/20 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3 text-gradient flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  CATEGORÍAS
                </h3>
                <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-thin">
                  <button
                    onClick={() => handleCategorySelect('')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition text-xs flex items-center gap-2 ${selectedCategory === ''
                      ? 'bg-venuz-pink text-white font-semibold'
                      : 'text-gray-400 hover:bg-venuz-gray hover:text-white'
                      }`}
                  >
                    <span>🌟</span>
                    Todo
                  </button>
                  {CATEGORIES.map(cat => {
                    const Icon = getCategoryIcon(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition text-xs flex items-center gap-2 ${selectedCategory === cat.id
                          ? 'bg-venuz-pink text-white font-semibold'
                          : 'text-gray-400 hover:bg-venuz-gray hover:text-white'
                          }`}
                      >
                        <Icon size={14} />
                        {cat.name}
                        {cat.isTemporary && (
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                            Live
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* ====================================
              FEED PRINCIPAL - Centro
              Desktop: col-span-7
              Mobile: col-span-12 (full width)
              ==================================== */}
          <main className="col-span-12 lg:col-span-7 xl:col-span-7">

            {/* Filtros móviles - Solo visible en móvil */}
            <div className="lg:hidden mb-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`px-4 py-2 rounded-full text-xs whitespace-nowrap transition flex items-center gap-2 ${selectedCategory === ''
                    ? 'bg-venuz-pink text-white'
                    : 'bg-venuz-gray text-gray-400'
                    }`}
                >
                  🌟 Todo
                </button>
                {CATEGORIES.slice(0, 5).map(cat => {
                  const Icon = getCategoryIcon(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`px-4 py-2 rounded-full text-xs whitespace-nowrap transition flex items-center gap-2 ${selectedCategory === cat.id
                        ? 'bg-venuz-pink text-white'
                        : 'bg-venuz-gray text-gray-400'
                        }`}
                    >
                      <Icon size={14} />
                      {cat.name}
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowFilters(true)}
                  className="px-4 py-2 rounded-full text-xs whitespace-nowrap bg-venuz-gray text-gray-400 flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  Más
                </button>
              </div>
            </div>

            {/* 🔥 NUEVOS: Feed Mode Tabs (Nightlife vs Adult) + Algorithm Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <FeedTabs
                initialMode="all"
                onModeChange={(mode) => setFeedMode(mode)}
              />
              <AlgorithmBadge
                isActive={isHighwayActive || false}
                intentScore={intentScore || 0.5}
                variant={abVariant}
              />
            </div>

            {/* Trust Signals Banner - SEO & Trust */}
            <TrustSignalsBanner variant="compact" className="mb-6 rounded-xl overflow-hidden shadow-lg border border-white/5" />

            {/* 📍 Location Indicator - Solo visible en modo "Cerca de mí" */}
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

            {/* Error Display for Debugging */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                <p className="font-bold mb-1">⚠️ Error detectado:</p>
                <p>{error}</p>
              </div>
            )}

            {/* Feed de contenido */}
            <div
              ref={feedRef}
              className="
                relative
                lg:h-auto
                h-[calc(100vh-180px)]
                overflow-y-auto
                snap-y snap-mandatory lg:snap-none
                scrollbar-hide
                lg:space-y-6
              "
            >
              {isLoading && content.length === 0 ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="venuz-card h-[500px] skeleton" />
                  ))}
                </div>
              ) : filteredContent.length === 0 ? (
                <div className="text-center py-20 venuz-card">
                  {activeMenu === 'favoritos' ? (
                    <>
                      <Heart className="w-16 h-16 text-venuz-pink mx-auto mb-4" />
                      <p className="text-2xl text-gray-400 mb-2">
                        No tienes favoritos aún
                      </p>
                      <p className="text-gray-500 mb-6">
                        Dale ❤️ a lo que te gusta y aparecerá aquí
                      </p>
                      <button
                        onClick={() => setActiveMenu('inicio')}
                        className="venuz-button"
                      >
                        Explorar contenido
                      </button>
                    </>
                  ) : activeMenu === 'cerca' ? (
                    <>
                      <MapPin className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-2xl text-gray-400 mb-2">
                        No hay contenido cerca de ti
                      </p>

                      {/* Status de ubicación */}
                      <div className="bg-gray-800/50 rounded-lg px-4 py-3 mb-4 inline-block">
                        {locLoading ? (
                          <p className="text-gray-400 text-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Detectando tu ubicación...
                          </p>
                        ) : lat && lng ? (
                          <p className="text-green-400 text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            GPS activo: {selectedCity !== 'Todas' ? selectedCity : 'Ubicación detectada'}
                            <span className="text-gray-500 text-xs">
                              ({lat.toFixed(2)}, {lng.toFixed(2)})
                            </span>
                          </p>
                        ) : locError ? (
                          <p className="text-amber-400 text-sm flex items-center gap-2">
                            ⚠️ {locError}
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            {selectedCity === 'Todas'
                              ? 'Selecciona una ciudad o activa tu ubicación'
                              : `Buscando en: ${selectedCity}`
                            }
                          </p>
                        )}
                      </div>

                      <p className="text-gray-500 mb-6 text-sm max-w-md mx-auto">
                        {lat && lng
                          ? 'No encontramos lugares o eventos dentro de 50km de tu ubicación. Prueba aumentar el radio o ver todo el contenido.'
                          : 'Activa tu GPS para ver contenido cercano a ti, o selecciona una ciudad manual.'
                        }
                      </p>

                      <div className="flex flex-wrap justify-center gap-2">
                        {!lat && (
                          <button
                            onClick={() => detectLocation()}
                            className="venuz-button"
                          >
                            📍 Activar GPS
                          </button>
                        )}
                        <button
                          onClick={() => setManualCity('CDMX')}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                        >
                          🏙️ Ver CDMX
                        </button>
                        <button
                          onClick={() => setManualCity('Guadalajara')}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                        >
                          🌮 Ver Guadalajara
                        </button>
                        <button
                          onClick={() => setActiveMenu('inicio')}
                          className="px-4 py-2 bg-venuz-pink/20 text-venuz-pink rounded-lg hover:bg-venuz-pink/30 transition text-sm"
                        >
                          Ver todo
                        </button>
                      </div>
                    </>
                  ) : activeMenu === 'tendencias' ? (
                    <>
                      <Flame className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                      <p className="text-2xl text-gray-400 mb-2">
                        Sin tendencias esta semana
                      </p>
                      <p className="text-gray-500 mb-6">
                        Vuelve pronto para ver el contenido más popular
                      </p>
                      <button
                        onClick={() => setActiveMenu('inicio')}
                        className="venuz-button"
                      >
                        Ver todo el contenido
                      </button>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-16 h-16 text-venuz-pink mx-auto mb-4" />
                      <p className="text-2xl text-gray-500 mb-4">
                        No hay contenido en esta categoría
                      </p>
                      <button
                        onClick={() => handleCategorySelect('')}
                        className="venuz-button"
                      >
                        Ver todo
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredContent.map((item, index) => (
                    <article
                      key={item.id}
                      data-index={index}
                      ref={(el) => {
                        if (el && observerRef.current) {
                          observerRef.current.observe(el);
                        }
                      }}
                      className="venuz-card group overflow-hidden snap-center lg:snap-align-none"
                    >
                      {/* ====================================
                          CARD DESKTOP (Optimizado - VIP Wrapper)
                          ==================================== */}
                      <LuxuryCard className="border-none bg-transparent shadow-none p-0 group-hover:bg-transparent">
                        <div className="hidden lg:block w-full">
                          <FeedCardDynamic
                            item={item}
                            isActive={activeIndex === index}
                            onClick={handleContentClick}
                            onShare={handleShare}
                            className="max-w-md mx-auto shadow-2xl hover:shadow-vip-gold/20 transition-shadow duration-300"
                          />
                        </div>
                      </LuxuryCard>
                      {/* ====================================
                          CARD DESKTOP (Optimizado - Dynamic)
                          ==================================== */}
                      <div className="hidden lg:block w-full">
                        <FeedCardDynamic
                          item={item}
                          isActive={activeIndex === index}
                          onClick={handleContentClick}
                          onShare={handleShare}
                          className="max-w-md mx-auto shadow-2xl hover:shadow-venuz-pink/20 transition-shadow duration-300"
                        />
                      </div>


                      {/* ====================================
                          CARD MOBILE - Estilo TikTok (Optimizado)
                          ==================================== */}
                      <div className="lg:hidden">
                        <FeedCardDynamic
                          item={item}
                          isActive={activeIndex === index}
                          onClick={handleContentClick}
                          onShare={handleShare}
                          className="h-[calc(100vh-140px)] w-full rounded-xl border border-vip-gold/30 shadow-[0_0_15px_rgba(191,149,63,0.2)]"
                        />
                      </div>
                    </article>
                  ))}

                  {/* Infinite Scroll Trigger */}
                  <div id="infinite-trigger" className="h-20 flex items-center justify-center">
                    {hasMore && (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-venuz-pink animate-spin" />
                        <p className="text-xs text-gray-500">Cargando más experiencias...</p>
                      </div>
                    )}
                    {!hasMore && content.length > 0 && (
                      <p className="text-gray-500 text-sm">Has llegado al final de la noche 🌙</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Feed Progress Indicator - Solo móvil */}
            <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 lg:hidden flex flex-col gap-2">
              {filteredContent.slice(0, 8).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const cards = feedRef.current?.querySelectorAll("[data-index]");
                    cards?.[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={`
                    w-2 h-6 rounded-full transition-all duration-300
                    ${activeIndex === index
                      ? "bg-gradient-to-b from-venuz-pink to-venuz-red scale-110"
                      : "bg-white/20 hover:bg-white/40"
                    }
                  `}
                />
              ))}
            </div>
          </main>

          {/* ====================================
              SIDEBAR DERECHO - Solo Desktop (xl+)
              Publicidad + Stats + Trending
              ==================================== */}
          <aside className="hidden xl:block col-span-3">
            <div className="sticky top-24 space-y-4">

              {/* Banner publicitario 1 */}
              <a
                href="https://wa.me/523221234567?text=Hola%2C%20quiero%20anunciar%20mi%20negocio%20en%20VENUZ"
                target="_blank"
                rel="noopener noreferrer"
                className="venuz-card h-[250px] bg-gradient-to-br from-venuz-pink to-venuz-gold flex items-center justify-center overflow-hidden relative block hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="text-center p-4 relative z-10">
                  <p className="text-white font-bold text-lg mb-2">
                    📢 ESPACIO PUBLICITARIO
                  </p>
                  <p className="text-white/80 text-sm mb-4">
                    Promociona tu negocio aquí
                  </p>
                  <span className="inline-block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm transition">
                    💬 Contáctanos
                  </span>
                </div>
              </a>

              {/* Top Rated & Trending Ranking */}
              <TopRatedSidebar
                items={exampleTopRatedItems}
                className="mb-4"
              />

              {/* Banner publicitario 2 */}
              <div className="venuz-card h-[200px] bg-venuz-charcoal border-2 border-venuz-pink/30 flex items-center justify-center">
                <div className="text-center p-4">
                  <p className="text-venuz-pink font-bold mb-2 flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    BANNER PREMIUM
                  </p>
                  <p className="text-gray-400 text-xs mb-3">
                    Mayor visibilidad
                  </p>
                  <p className="text-venuz-gold font-bold">
                    $200 USD/mes
                  </p>
                </div>
              </div>

              {/* Trending hashtags */}
              <div className="venuz-card p-4">
                <h3 className="text-sm font-semibold mb-3 text-venuz-pink flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  TRENDING
                </h3>
                <div className="space-y-2 text-xs">
                  {TRENDING_TAGS.map((tag, i) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between text-gray-400 hover:text-venuz-pink cursor-pointer transition group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">{tag}</span>
                      <span className="text-venuz-gold">{Math.floor(Math.random() * 1000) + 100}+</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Final */}
              <div className="venuz-card p-4 bg-gradient-to-br from-venuz-charcoal to-venuz-gray">
                <p className="text-sm text-gray-400 mb-3">
                  ¿Tienes un negocio de entretenimiento?
                </p>
                <button className="w-full venuz-button text-sm">
                  Registra tu negocio
                </button>
              </div>
            </div>
          </aside>

        </div>
      </div >

      {/* Content Preview Modal */}
      < ContentPreviewModal
        content={selectedContent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLike={handleLike}
        onShare={handleShare}

        relatedContent={getRelatedContent(selectedContent)}
      />

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          setFilterOptions(newFilters);
          // Opcional: Feedback visual o toast
          console.log('[VENUZ] Filtros aplicados:', newFilters);
        }}
        currentFilters={filterOptions}
      />
    </div >
  );
}


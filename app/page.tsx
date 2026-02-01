"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import ContentCard, { VideoPlayer } from "@/components/ContentCard";
import ContentCardDesktop from "@/components/ContentCardDesktop";
import Image from "next/image";
import ContentPreviewModal from "@/components/ContentPreviewModal";
import MegaMenu from "@/components/MegaMenu";
import { useAdaptiveFeed } from "@/hooks/useAdaptiveFeed";
import type { ContentItem } from "@/hooks/useContent";
import { sanitizeImageUrl } from "@/lib/media";
import {
  ConcertIcon,
  BarIcon,
  ClubIcon,
  EscortIcon,
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
  { id: "escort", name: "Escorts", description: "Acompañantes verificadas" },
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

export default function HomePage() {
  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState('inicio');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Todas");

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
  });

  // Centralized Device Detection
  const { isMobile, isDesktop } = useDevice();

  // UI State
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [notificationCount, setNotificationCount] = useState(5);
  const [ageVerified, setAgeVerified] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Modal state para interstitial
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refs
  const feedRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const verified = localStorage.getItem('venuz_age_verified')
    if (verified === 'true') {
      setAgeVerified(true)
      setShowSplash(false)
    } else {
      setTimeout(() => setShowSplash(false), 2000)
    }

    if (!localStorage.getItem('venuz_user_id')) {
      localStorage.setItem('venuz_user_id', `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }

    // Cargar ciudad guardada
    const storedCity = localStorage.getItem('venuz_user_city');
    if (storedCity) setSelectedCity(storedCity);
  }, [])

  const handleAgeVerification = (verified: boolean) => {
    if (verified) {
      localStorage.setItem('venuz_age_verified', 'true')
      setAgeVerified(true)
    } else {
      window.location.href = 'https://www.google.com'
    }
  }

  const filteredContent = content;

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
    setSelectedCity(city);
    localStorage.setItem('venuz_user_city', city);
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

  // ==========================================
  // AGE VERIFICATION
  // ==========================================
  if (!ageVerified) {
    return (
      <div className="h-screen flex items-center justify-center bg-black p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <div className="venuz-card p-8 text-center">
            <div className="text-6xl mb-6">🔞</div>
            <h1 className="text-4xl font-display font-bold text-gradient mb-4">
              VENUZ
            </h1>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Verificación de Edad
            </h2>
            <p className="text-white/70 mb-8">
              Este sitio contiene contenido para adultos. Debes tener al menos 18 años para continuar.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleAgeVerification(true)}
                className="w-full venuz-button"
              >
                Soy mayor de 18 años
              </button>
              <button
                onClick={() => handleAgeVerification(false)}
                className="w-full px-6 py-3 rounded-xl font-semibold bg-venuz-gray text-white/70 hover:bg-venuz-gray/80 transition-all"
              >
                Soy menor de 18 años
              </button>
            </div>
            <p className="text-xs text-white/40 mt-6">
              Al continuar, aceptas que eres mayor de edad según las leyes de tu país.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // ==========================================
  // MAIN LAYOUT - RESPONSIVE HÃ BRIDO
  // ==========================================
  return (
    <div className="min-h-screen bg-black">
      <Header
        notificationCount={notificationCount}
        onSearch={handleSearch}
        onCityChange={handleCityChange}
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
              <div className="venuz-card p-4">
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
              <div className="venuz-card p-4">
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

            {/* Trust Signals Banner - SEO & Trust */}
            <TrustSignalsBanner variant="compact" className="mb-6 rounded-xl overflow-hidden shadow-lg border border-white/5" />

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
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredContent.map((item, index) => (
                    <motion.article
                      key={item.id}
                      data-index={index}
                      ref={(el) => {
                        if (el && observerRef.current) {
                          observerRef.current.observe(el);
                        }
                      }}
                      className="venuz-card group overflow-hidden snap-center lg:snap-align-none"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* ====================================
                          CARD DESKTOP
                          ==================================== */}
                      <div className="hidden lg:block">
                        <ContentCardDesktop
                          content={item}
                          isActive={activeIndex === index}
                          onClick={handleContentClick}
                          onShare={handleShare}
                        />
                      </div>


                      {/* ====================================
                          CARD MOBILE - Estilo TikTok
                          ==================================== */}
                      <div className="lg:hidden">
                        <ContentCard
                          content={item}
                          isActive={activeIndex === index}
                          onLike={handleLike}
                          onShare={handleShare}
                          onClick={handleContentClick}
                        />
                      </div>
                    </motion.article>
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
              <div className="venuz-card h-[250px] bg-gradient-to-br from-venuz-pink to-venuz-gold flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-black/20" />
                <div className="text-center p-4 relative z-10">
                  <p className="text-white font-bold text-lg mb-2">
                    📢 ESPACIO PUBLICITARIO
                  </p>
                  <p className="text-white/80 text-sm mb-4">
                    Promociona tu negocio aquí
                  </p>
                  <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm transition">
                    Contratar ahora
                  </button>
                </div>
              </div>

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
    </div >
  );
}


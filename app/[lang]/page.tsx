"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import ContentCard, { VideoPlayer, MemoizedContentCard } from "@/components/ContentCard";
import dynamic from 'next/dynamic';
const DynamicFeed = dynamic(() => import('@/components/Feed'), { ssr: false });
import BannerRotator from "@/components/ui/BannerRotator";
import Image from "next/image";
import ContentPreviewModal from "@/components/ContentPreviewModal";
import AdvancedFiltersModal, { FilterOptions } from '@/components/AdvancedFiltersModal';
import MegaMenu from "@/components/MegaMenu";
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
import SidebarMenu from "@/components/SidebarMenu";


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

import { useTranslations } from 'next-intl';

export default function HomePage({ params }: { params: { lang: string, region?: string } }) {
  const tHome = useTranslations('home');
  const tNav = useTranslations('nav');
  const tVenue = useTranslations('venue');

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState('inicio');
  const [searchQuery, setSearchQuery] = useState("");

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

  // If region is in params, enforce it for initial load
  useEffect(() => {
    if (params.region) {
      console.log(`[VENUZ] 🌎 Global Scale: Locking context to region: ${params.region}`);
      // Mapeo simple de códigos a Nombres (mejorable con fetchRegions)
      const regionNames: Record<string, string> = {
        'nayarit-mx': 'Nayarit',
        'cancun-mx': 'Cancún',
        'miami-us': 'Miami',
        'lisboa-pt': 'Lisboa'
      };
      setManualCity(regionNames[params.region] || params.region.split('-')[0].charAt(0).toUpperCase() + params.region.split('-')[0].slice(1));
    }
  }, [params.region, setManualCity]);



  // Centralized Device Detection
  const { isMobile, isDesktop } = useDevice();

  // UI State
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [notificationCount, setNotificationCount] = useState(5);
  const [feedMode, setFeedMode] = useState<FeedMode>('all');

  // Modal state para interstitial
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);



  // Refs
  const feedRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('venuz_user_id')) {
      localStorage.setItem('venuz_user_id', `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [])







  /* Handlers */
  const handleShare = useCallback((id: string) => {
    // Basic share implementation or placeholder since we don't have 'content' here anymore
    // If needed, we can pass content from Feed.tsx back up, or just share current URL
    if (typeof navigator.share !== 'undefined') {
      navigator.share({
        title: 'VENUZ',
        text: 'Check out this venue on VENUZ',
        url: window.location.href,
      }).catch(console.error);
    }
  }, []);

  const handleLike = useCallback((id: string) => {
    console.log('[VENUZ] Like:', id);
  }, []);

  const handleContentClick = useCallback((item: ContentItem) => {
    setSelectedContent(item);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedContent(null);
  }, []);

  const getRelatedContent = useCallback((currentItem: ContentItem | null) => {
    // Placeholder as we don't have full content access here
    return [];
  }, []);

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





  // ==========================================
  // MAIN LAYOUT - RESPONSIVE HÃ BRIDO
  // ==========================================
  return (
    <div className="min-h-screen bg-black">
      <Header
        notificationCount={notificationCount}
        onSearch={handleSearch}
        onCityChange={handleCityChange}
        onRefresh={() => {
          console.log("Refrescando feed...");
          window.location.reload(); // Hard reload asegurado para limpiar PWA cache si es necesario, o usar refresh() del hook
        }}
      />



      {/* 🔥 Banner Publicitario Rotativo (Full Width - Pegado al header) */}
      <div className="w-full pt-[60px] sm:pt-[70px]">
        <BannerRotator />
      </div>

      {/* ====================================
          MAIN CONTENT AREA
          ==================================== */}
      <div className="max-w-[1800px] mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-6 relative z-10">

        <div className="grid grid-cols-12 gap-6 bg-transparent px-4 sm:px-0">

          {/* ====================================
              SIDEBAR IZQUIERDO - Solo Desktop (lg+)
              MenÃº + CategorÃ­as (Estilo Casino/Neon)
              ==================================== */}
          <SidebarMenu
            lang={params.lang}
            region={params.region}
            activeMenu={activeMenu}
            onMenuChange={setActiveMenu}
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />

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

            {/* HEADER VENUZ — Contexto Local */}
            <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-cyan-500/20 px-4 py-3 mb-4 rounded-b-xl shadow-lg shadow-cyan-900/10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                    VENUZ 🌴
                  </h1>
                  <p className="text-xs text-gray-400 font-medium">
                    Puerto Vallarta · {new Date().toLocaleDateString('es-MX', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-white/10">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-gray-200 font-bold">En vivo</span>
                </div>
              </div>
            </div>

            {/* 🔥 NUEVOS: Feed Mode Tabs (Nightlife vs Adult) + Algorithm Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <FeedTabs
                initialMode="all"
                onModeChange={(mode) => setFeedMode(mode)}
              />
              <AlgorithmBadge
                isActive={true} // Feed controls this internally but we show badge
                intentScore={0.7} // Placeholder or passed back?
                variant={null}
              />
            </div>

            {/* Trust Signals Banner - SEO & Trust */}
            <TrustSignalsBanner variant="compact" className="mb-6 rounded-xl overflow-hidden shadow-lg border border-white/5" />

            {/* ⚡ REACT HYDRATION FIX: Dynamic Feed Import */}
            <DynamicFeed
              activeMenu={activeMenu}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              selectedCity={selectedCity}
              lat={lat}
              lng={lng}
              filterOptions={filterOptions}
              feedMode={feedMode}
              onContentClick={handleContentClick}
              onShare={handleShare}
              onCityChange={handleCityChange}
              detectLocation={detectLocation}
              setManualCity={setManualCity}
              locLoading={locLoading}
              locError={locError}
              setActiveMenu={setActiveMenu}
              handleCategorySelect={handleCategorySelect}
            />
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
    </div>
  );
}


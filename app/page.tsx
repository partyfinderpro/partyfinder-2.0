"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import ContentCard from "@/components/ContentCard";
import MegaMenu from "@/components/MegaMenu";
import {
  ConcertIcon,
  BarIcon,
  ClubIcon,
  EscortIcon,
  PartyIcon,
  LiveIcon,
  getCategoryIcon,
} from "@/components/icons/CategoryIcons";
import { Filter, SlidersHorizontal, MapPin, Sparkles } from "lucide-react";

// ============================================
// VENUZ - Página Principal con TODOS los FIXES
// ============================================
// FIX #1: Header con espaciado dinámico ✅
// FIX #2: ContentCard con soporte de video y afiliados ✅
// FIX #3: Iconos SVG premium en lugar de emojis ✅
// FIX #4: Video player lazy loading implementado ✅
// ============================================

// Tipos
interface ContentItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
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
  affiliate_source?: "camsoda" | "stripchat" | "chaturbate" | "other";
  views?: number;
  likes?: number;
  created_at?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  isTemporary?: boolean;
}

// Categorías con iconos premium (FIX #3)
const CATEGORIES: Category[] = [
  { id: "concierto", name: "Conciertos", description: "Música en vivo", isTemporary: true },
  { id: "evento", name: "Eventos", description: "Fiestas y reuniones", isTemporary: true },
  { id: "bar", name: "Bares", description: "Nightlife estática" },
  { id: "club", name: "Clubs", description: "Discotecas y antros" },
  { id: "escort", name: "Escorts", description: "Acompañantes verificadas" },
  { id: "modelo", name: "Modelos", description: "Modelos profesionales" },
  { id: "live", name: "En Vivo", description: "Streams y cams" },
];

// Mock data para demostración
const MOCK_CONTENT: ContentItem[] = [
  {
    id: "1",
    title: "Noche Latina @ Club Mandala",
    description: "La mejor fiesta latina de Puerto Vallarta con DJ internacional",
    image_url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80",
    category: "club",
    location: "Zona Romántica",
    distance_km: 1.2,
    is_verified: true,
    is_open_now: true,
    open_until: "4:00 AM",
    views: 1523,
    likes: 234,
  },
  {
    id: "2",
    title: "Sofia - Modelo Premium",
    description: "Servicio VIP disponible 24/7. Fotos verificadas.",
    image_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80",
    category: "escort",
    location: "Hotel Zone",
    distance_km: 0.8,
    is_verified: true,
    is_premium: true,
    views: 3421,
    likes: 567,
  },
  {
    id: "3",
    title: "Tributo a Queen - Teatro Vallarta",
    description: "Espectáculo musical con la banda Bohemian Symphony",
    image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
    category: "concierto",
    location: "Centro",
    distance_km: 2.5,
    is_verified: true,
    is_open_now: false,
    views: 892,
    likes: 145,
  },
  {
    id: "4",
    title: "CamSoda Live - Valentina",
    description: "En vivo ahora - Show especial de viernes",
    image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    video_url: "https://example.com/stream.mp4", // Placeholder
    category: "live",
    affiliate_url: "https://camsoda.com/ref/venuz",
    affiliate_source: "camsoda",
    is_verified: true,
    is_premium: true,
    views: 5678,
    likes: 1234,
  },
  {
    id: "5",
    title: "La Cantina del Pancho",
    description: "Mezcales artesanales y coctelería mexicana",
    image_url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
    category: "bar",
    location: "5 de Diciembre",
    distance_km: 1.8,
    is_verified: true,
    is_open_now: true,
    open_until: "2:00 AM",
    views: 445,
    likes: 89,
  },
];

export default function Home() {
  // State
  const [content, setContent] = useState<ContentItem[]>(MOCK_CONTENT);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [notificationCount, setNotificationCount] = useState(5);
  const [ageVerified, setAgeVerified] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Refs
  const feedRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Check if user already verified age
    const verified = localStorage.getItem('venuz_age_verified')
    if (verified === 'true') {
      setAgeVerified(true)
      setShowSplash(false)
    } else {
      // Show splash for 2 seconds
      setTimeout(() => setShowSplash(false), 2000)
    }

    // Generate anonymous user ID if doesn't exist
    if (!localStorage.getItem('venuz_user_id')) {
      localStorage.setItem('venuz_user_id', `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [])

  const handleAgeVerification = (verified: boolean) => {
    if (verified) {
      localStorage.setItem('venuz_age_verified', 'true')
      setAgeVerified(true)
    } else {
      window.location.href = 'https://www.google.com'
    }
  }

  // Filtrar contenido por categoría
  const filteredContent = selectedCategory
    ? content.filter(item => item.category === selectedCategory)
    : content;

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
        root: feedRef.current,
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0.5,
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Handlers
  const handleLike = useCallback((id: string) => {
    setContent(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, likes: (item.likes || 0) + 1 }
          : item
      )
    );
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

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setActiveIndex(0);
    // Scroll to top
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (showSplash) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-7xl md:text-9xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 mb-4">
            VENUZ
          </h1>
          <p className="text-pink-500 text-xl md:text-2xl font-semibold">
            Tu mundo de entretenimiento
          </p>
        </motion.div>
      </div>
    )
  }

  if (!ageVerified) {
    return (
      <div className="h-screen flex items-center justify-center bg-black p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <div className="venuz-card p-8 text-center bg-white/5 rounded-3xl border border-white/10">
            <div className="text-6xl mb-6">🔞</div>

            <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 mb-4">
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
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-4 rounded-xl hover:scale-105 transition-transform"
              >
                Soy mayor de 18 años
              </button>

              <button
                onClick={() => handleAgeVerification(false)}
                className="w-full px-6 py-3 rounded-xl font-semibold bg-white/10 text-white/70 hover:bg-white/20 transition-all"
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Header - FIX #1 Aplicado */}
      <Header
        notificationCount={notificationCount}
        onMenuClick={() => setShowFilters(true)}
        onNotificationClick={() => setNotificationCount(0)}
        onHighlightsClick={() => handleCategorySelect("destacado")}
        currentLocation="Puerto Vallarta, JAL"
      />

      {/* Main Content */}
      <main className="relative pt-20 sm:pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Filters Bar */}
          <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {/* MegaMenu - FIX #3 Aplicado */}
            <MegaMenu
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />

            {/* Quick Filter Chips - Con iconos premium */}
            <div className="flex items-center gap-2">
              {CATEGORIES.slice(0, 4).map((cat) => {
                const Icon = getCategoryIcon(cat.id);
                const isActive = selectedCategory === cat.id;

                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategorySelect(isActive ? "" : cat.id)}
                    className={`
                      flex items-center gap-2
                      px-4 py-2 rounded-full
                      text-sm font-medium
                      whitespace-nowrap
                      transition-all duration-300
                      ${isActive
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                      }
                    `}
                  >
                    <Icon size={18} />
                    {cat.name}
                  </motion.button>
                );
              })}

              {/* More Filters */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(true)}
                className="
                  flex items-center gap-2
                  px-4 py-2 rounded-full
                  bg-white/5 text-white/70
                  hover:bg-white/10 hover:text-white
                  border border-white/10
                  transition-colors
                "
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
              </motion.button>
            </div>
          </div>

          {/* Content Feed - TikTok Style */}
          <div
            ref={feedRef}
            className="
              relative
              h-[calc(100vh-180px)]
              overflow-y-auto
              snap-y snap-mandatory
              scrollbar-hide
              rounded-3xl
            "
          >
            {filteredContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No hay contenido disponible
                </h3>
                <p className="text-white/50 max-w-xs">
                  Intenta seleccionar otra categoría o ajusta los filtros
                </p>
              </div>
            ) : (
              <div className="space-y-6 pb-6">
                {filteredContent.map((item, index) => (
                  <motion.div
                    key={item.id}
                    data-index={index}
                    ref={(el) => {
                      if (el && observerRef.current) {
                        observerRef.current.observe(el);
                      }
                    }}
                    className="snap-center"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* ContentCard - FIX #2 y #4 Aplicados */}
                    <ContentCard
                      content={item}
                      isActive={activeIndex === index}
                      onLike={handleLike}
                      onShare={handleShare}
                      onClick={(id) => console.log("Navigate to:", id)}
                    />
                  </motion.div>
                ))}

                {/* Load More Indicator */}
                {isLoading && (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Feed Progress Indicator */}
          <div className="fixed right-4 top-1/2 -translate-x-1/2 z-40 hidden lg:flex flex-col gap-2">
            {filteredContent.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  const cards = feedRef.current?.querySelectorAll("[data-index]");
                  cards?.[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className={`
                  w-2 h-8 rounded-full
                  transition-all duration-300
                  ${activeIndex === index
                    ? "bg-gradient-to-b from-pink-500 to-rose-500 scale-110"
                    : "bg-white/20 hover:bg-white/40"
                  }
                `}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Hide scrollbar utility */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

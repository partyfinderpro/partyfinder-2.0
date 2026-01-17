'use client';

import { useState } from 'react';
import clsx from 'clsx';
import InfiniteFeed from '@/components/InfiniteFeed';
import MegaMenu from '@/components/MegaMenu';
import SearchOverlay from '@/components/SearchOverlay';
import {
  Bell,
  Search,
  TrendingUp,
  MapPin,
  Heart,
  Star,
  Menu,
  Zap,
  ChevronRight,
  User,
  Settings,
  HelpCircle,
  BarChart3
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  category: string | null;
  source: string | null;
  lat: number | null;
  lng: number | null;
  rating?: number;
  total_ratings?: number;
  is_open_now?: boolean;
}

import { PremiumFilterPanel, PremiumFiltersState } from '@/components/PremiumFilters';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [premiumFilters, setPremiumFilters] = useState<PremiumFiltersState>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navItems = [
    { id: 'all', name: 'Inicio', icon: TrendingUp, action: () => setFilter('all') },
    { id: 'trending', name: 'Tendencias', icon: Zap, action: () => setFilter('trending') },
    { id: 'nearby', name: 'Cerca de mí', icon: MapPin, action: () => setFilter('nearby') },
    { id: 'favorites', name: 'Favoritos', icon: Star, action: () => router.push('/favorites') },
  ];

  const categories = [
    { id: 'all', name: 'Todo', icon: '🌟' },
    { id: 'club', name: 'Clubs', icon: '🎉' },
    { id: 'evento', name: 'Eventos', icon: '🎊' },
    { id: 'concierto', name: 'Conciertos', icon: '🎸' },
    { id: 'bar', name: 'Bares', icon: '🍺' },
    { id: 'show', name: 'Shows', icon: '🎭' },
    { id: 'feria', name: 'Ferias', icon: '🎪' },
    { id: 'tabledance', name: 'Table Dance', icon: '💃' },
    { id: 'escort', name: 'Acompañantes', icon: '💋' },
    { id: 'masaje', name: 'Masajes', icon: '💆' },
    { id: 'restaurante', name: 'Restaurantes', icon: '🍽️' },
    { id: 'beach', name: 'Beach Clubs', icon: '🏖️' },
    { id: 'hotel', name: 'Hoteles', icon: '🏨' },
  ];

  return (
    <div className="h-screen bg-black overflow-hidden flex flex-col">
      {/* Header Superior - Desktop & Mobile */}
      <header className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-black/50 backdrop-blur-md z-[60]">
        <div className="flex items-center gap-8">
          <h1
            onClick={() => setFilter('all')}
            className="text-3xl font-display font-bold text-gradient glow-strong cursor-pointer"
          >
            VENUZ
          </h1>
          <div className="hidden lg:flex items-center gap-2 text-gray-400 text-sm hover:text-white transition-colors cursor-pointer">
            <MapPin className="w-4 h-4 text-venuz-pink" />
            <span>Puerto Vallarta, Jalisco</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push('/notifications')}
            className="flex items-center gap-2 text-gray-400 hover:text-venuz-pink transition-colors group"
          >
            <Bell className="w-5 h-5 group-hover:animate-bounce" />
            <span className="text-sm font-medium">Notificaciones</span>
          </button>

          <button
            onClick={() => setFilter('trending')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-venuz-pink to-venuz-red text-white font-bold text-sm shadow-glow-pink hover:scale-105 transition-all"
          >
            <span>🔥</span>
            <span>Destacados</span>
          </button>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden p-2 text-white bg-venuz-pink/20 rounded-xl"
          >
            <Menu className="w-6 h-6 text-venuz-pink" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Izquierda - EXCLUSIVA DESKTOP */}
        <aside className="hidden lg:flex flex-col w-[280px] border-r border-white/5 bg-black p-6 gap-8 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className={clsx(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                  filter === item.id ? "bg-venuz-pink/10 text-venuz-pink border border-venuz-pink/20" : "hover:bg-white/5 text-gray-400 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className={clsx("font-medium", filter === item.id && "font-bold")}>{item.name}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-venuz-pink uppercase tracking-[0.2em] px-4">
              CATEGORÍAS
            </h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={clsx(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group",
                    filter === cat.id ? "bg-venuz-pink/10 text-venuz-pink" : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  {filter === cat.id && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/5 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-white text-sm transition-colors">
              <User className="w-4 h-4" /> Mi Perfil
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-white text-sm transition-colors">
              <Settings className="w-4 h-4" /> Ajustes
            </button>
          </div>
        </aside>

        {/* Feed Principal - Responsive */}
        <main className="flex-1 relative bg-black overflow-hidden flex flex-col items-center">
          <div className="w-full max-w-[500px] lg:max-w-none h-full feed-container scrollbar-none overflow-y-auto">
            {/* Componente Inteligente de Feed */}
            <InfiniteFeed category={filter} filters={premiumFilters} />
          </div>

          <PremiumFilterPanel onApply={setPremiumFilters} />


          {/* Navigation Mobile pill - EXTRA LARGE FOR ACCESSIBILITY */}
          <nav className="lg:hidden absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] w-full px-6 flex justify-center">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="bg-venuz-pink text-white px-10 py-5 rounded-2xl flex items-center gap-4 shadow-[0_20px_50px_rgba(255,20,147,0.4)] hover:scale-105 active:scale-95 transition-all font-black text-xl uppercase tracking-tighter"
            >
              <Menu className="w-8 h-8" />
              <span>Explorar Categorías</span>
            </button>
          </nav>
        </main>

        {/* Sidebar Derecha - PUBLICIDAD & ESTADÍSTICAS */}
        <aside className="hidden xl:flex flex-col w-[350px] border-l border-white/5 bg-black p-6 gap-8 overflow-y-auto">
          {/* Espacio Publicitario Gradient Box */}
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-gradient-to-br from-venuz-pink via-red-500 to-amber-400 p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-white/80" />
              <h4 className="text-white font-black text-xl tracking-tight">ESPACIO PUBLICITARIO</h4>
            </div>
            <p className="text-white/90 text-sm font-medium">Promociona tu negocio aquí</p>

            {/* Minimal decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/20 blur-[60px] rounded-full pointer-events-none" />
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-venuz-pink uppercase tracking-[0.2em] px-2 flex items-center gap-2">
              📊 ESTADÍSTICAS HOY
            </h3>
            <div className="space-y-4 px-2">
              <div className="flex items-center justify-between group">
                <span className="text-gray-400 text-sm font-medium">Eventos totales</span>
                <span className="text-xl font-bold text-venuz-gold">0</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-venuz-red animate-pulse" />
                  <span className="text-gray-400 text-sm font-medium">En vivo</span>
                </div>
                <span className="text-xl font-bold text-venuz-gold">0</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-venuz-gold" />
                  <span className="text-gray-400 text-sm font-medium">Destacados</span>
                </div>
                <span className="text-xl font-bold text-venuz-gold">0</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400 text-sm font-medium">Vistas totales</span>
                </div>
                <span className="text-xl font-bold text-venuz-gold">0</span>
              </div>
            </div>
          </div>

          {/* Banner Premium Bottom */}
          <div className="mt-auto group cursor-pointer">
            <div className="venuz-card p-6 border border-white/5 group-hover:border-venuz-pink/30 hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-venuz-pink/10 text-venuz-pink">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <h5 className="font-black text-lg tracking-tight">BANNER PREMIUM</h5>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold">$200 USD/mes</span>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        </aside>
      </div >

      {/* MEGA MENU MOBILE OVERLAY */}
      < MegaMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)
        }
        onSelectCategory={(id) => setFilter(id)}
        currentCategory={filter}
      />

      {/* 🔍 BOTÓN FLOTANTE DE BÚSQUEDA AI */}
      <button
        onClick={() => setSearchOpen(true)}
        className="fixed bottom-24 right-6 z-50 bg-gradient-to-r from-venuz-pink to-venuz-red text-white p-4 rounded-full shadow-[0_10px_40px_rgba(255,20,147,0.5)] transition-transform hover:scale-110 active:scale-95"
        aria-label="Buscar con IA"
      >
        <Search className="w-6 h-6" />
      </button>

      {/* 🧠 BÚSQUEDA SEMÁNTICA OVERLAY */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div >
  );
}

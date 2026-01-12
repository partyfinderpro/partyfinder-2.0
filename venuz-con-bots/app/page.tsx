'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ContentCard from '@/components/ContentCard';
import clsx from 'clsx';
import MegaMenu from '@/components/MegaMenu';
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

export default function Home() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    try {
      // Simplified query for flattened schema
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('active', true)
        .order('scraped_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredContent = filter === 'all'
    ? content
    : content.filter(item => item.category === filter);

  const navItems = [
    { id: 'all', name: 'Inicio', icon: TrendingUp },
    { id: 'trending', name: 'Tendencias', icon: Zap },
    { id: 'nearby', name: 'Cerca de mí', icon: MapPin },
    { id: 'favorites', name: 'Favoritos', icon: Star },
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
  ];

  return (
    <div className="h-screen bg-black overflow-hidden flex flex-col">
      {/* Header Superior - Desktop & Mobile */}
      <header className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-black/50 backdrop-blur-md z-[60]">
        <div className="flex items-center gap-8">
          <h1 className="text-3xl font-display font-bold text-gradient glow-strong cursor-pointer">
            VENUZ
          </h1>
          <div className="hidden lg:flex items-center gap-2 text-gray-400 text-sm hover:text-white transition-colors cursor-pointer">
            <MapPin className="w-4 h-4 text-venuz-pink" />
            <span>Puerto Vallarta, Jalisco</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 group focus-within:ring-2 focus-within:ring-venuz-pink/50 transition-all">
            <Search className="w-4 h-4 text-gray-500 group-hover:text-venuz-pink transition-colors" />
            <input
              type="text"
              placeholder="Buscar planes..."
              className="bg-transparent border-none outline-none text-sm w-48 placeholder:text-gray-600"
            />
          </div>
          <button className="p-2 text-gray-400 hover:text-venuz-pink transition-colors relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-venuz-pink rounded-full" />
          </button>
          <button className="hidden lg:flex venuz-button py-2 px-6 text-sm">
            Destacados
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
          <div className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all group"
                >
                  <Icon className="w-5 h-5 group-hover:text-venuz-pink transition-colors" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">
              Categorías
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
          <div className="w-full max-w-[500px] lg:max-w-none h-full feed-container scrollbar-none">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-venuz-pink border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {filteredContent.map((item) => (
                  <div key={item.id} className="h-full snap-item">
                    <ContentCard
                      content={{
                        ...item,
                        // Fix for missing image_url if only video exists or vice-versa
                        image_url: item.image_url || '/placeholder-venue.jpg'
                      }}
                      isActive={true}
                    />
                  </div>
                ))}

                {filteredContent.length === 0 && (
                  <div className="h-full flex items-center justify-center text-center p-6 bg-transparent">
                    <div className="venuz-card p-12 glass-strong">
                      <p className="text-2xl text-gray-500 mb-6">
                        😔 No hay contenido en esta categoría
                      </p>
                      <button
                        onClick={() => setFilter('all')}
                        className="venuz-button"
                      >
                        Ver todo
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

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
          {/* Banner Publicitario Premium */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Publicidad</h3>
              <button className="text-[10px] text-venuz-pink hover:underline uppercase font-bold">Anúnciate</button>
            </div>

            <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-amber-500/20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 ring-1 ring-white/20">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-display font-bold text-white mb-2 leading-tight">TU NEGOCIO AQUÍ</h4>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">Promociona tu club, bar o servicio con banners premium que destacan.</p>
                <button className="w-full py-3 rounded-2xl bg-white text-black font-bold text-sm hover:bg-venuz-pink hover:text-white transition-colors">
                  Contactar Ventas
                </button>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-venuz-pink/30 rounded-full blur-[80px]" />
            </div>
          </div>

          {/* Estadísticas / Actividad */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Estadísticas Hoy</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-4 space-y-2 border border-white/5">
                <p className="text-gray-400 text-[10px] uppercase font-bold">Eventos</p>
                <p className="text-2xl font-display font-bold text-white">42</p>
                <div className="flex items-center gap-1 text-[10px] text-green-500">
                  <TrendingUp className="w-3 h-3" /> +12%
                </div>
              </div>
              <div className="glass rounded-2xl p-4 space-y-2 border border-white/5">
                <p className="text-gray-400 text-[10px] uppercase font-bold">Vistas</p>
                <p className="text-2xl font-display font-bold text-white">12.5k</p>
                <div className="flex items-center gap-1 text-[10px] text-green-500">
                  <TrendingUp className="w-3 h-3" /> +24%
                </div>
              </div>
            </div>
          </div>

          {/* Footer Sidebar */}
          <div className="mt-auto space-y-4">
            <div className="glass rounded-2xl p-4 flex items-center justify-between border border-white/5 group cursor-pointer hover:border-venuz-pink/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-venuz-pink/10 flex items-center justify-center group-hover:shadow-glow-pink transition-all">
                  <HelpCircle className="w-5 h-5 text-venuz-pink" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Centro de Ayuda</p>
                  <p className="text-[10px] text-gray-500 tracking-tight">Preguntas frecuentes</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
            </div>
            <p className="text-[10px] text-gray-600 text-center px-4">
              &copy; 2026 VENUZ APP. Todos los derechos reservados. Hecho con pasión en Vallarta.
            </p>
          </div>
        </aside>
      </div>

      {/* MEGA MENU MOBILE OVERLAY */}
      <MegaMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectCategory={(id) => setFilter(id)}
        currentCategory={filter}
      />
    </div>
  );
}

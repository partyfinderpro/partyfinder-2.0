'use client';

import { useState, useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import VenueCard from '@/components/VenueCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import UserLevel from '@/components/gamification/UserLevel';
import StreakCounter from '@/components/gamification/StreakCounter';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import InfiniteFeed from '@/components/InfiniteFeed';
import { Plus, Filter, Search } from 'lucide-react';
import { showAchievement } from '@/lib/notifications';
import SearchOverlay from '@/components/SearchOverlay';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [userXP, setUserXP] = useState(250);
  const [streak, setStreak] = useState(3);
  const [filter, setFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [useGeo, setUseGeo] = useState(false);

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => {
      setLoading(false);

      // Mostrar achievement de ejemplo
      const achievementTimer = setTimeout(() => {
        showAchievement(
          '¡Sistema de IA Activo!',
          'Has activado el cerebro de VENUZ',
          50,
          'award'
        );
      }, 2000);
      return () => clearTimeout(achievementTimer);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-deep-black">
      {/* Hero Section */}
      <HeroSection onNearbyClick={() => setUseGeo(true)} />

      {/* User Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <UserLevel currentXP={userXP} />
          <div className="flex items-center justify-center md:justify-end">
            <StreakCounter days={streak} />
          </div>
        </div>
      </div>

      {/* Main Content Feed */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-4xl font-display font-black text-white mb-2 tracking-tight">
              DESCUBRE <span className="text-neon-purple text-glow">LO NUEVO</span>
            </h2>
            <p className="text-gray-400 font-medium">
              Explora las experiencias más exclusivas de la ciudad
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setUseGeo(true)}
              className="flex-1 md:flex-none glass-effect px-6 py-3 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border-white/5 font-bold"
            >
              <Filter className="w-5 h-5 text-electric-cyan" />
              <span>Cerca de ti</span>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex-1 md:flex-none btn-casino px-6 py-3 text-sm flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span>Búsqueda IA</span>
            </button>
          </div>
        </div>

        {/* Categories / Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-6 scrollbar-none no-select">
          {['all', 'escort', 'club', 'bar', 'evento'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all border",
                filter === cat
                  ? "bg-neon-purple border-neon-purple text-white shadow-[0_0_15px_rgba(191,0,255,0.5)]"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
              )}
            >
              {cat === 'all' ? 'TODO' : cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Unified Feed */}
        <div className="relative">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <SkeletonCard count={6} />
            </div>
          ) : (
            <InfiniteFeed category={filter} useGeo={useGeo} />
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={Plus}
        label="Publicar"
        onClick={() => console.log('Add clicked')}
        position="bottom-right"
        className="hidden md:flex shadow-2xl"
      />

      {/* Semantic Search Overlay */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}

import { cn } from '@/lib/utils';

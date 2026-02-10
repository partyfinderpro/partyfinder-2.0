"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import LuxuryButton from "@/components/ui/LuxuryButton";
import Image from "next/image";

// Datos de ejemplo (reemplaza con fetch de Supabase en FASE 2)
const categorias = [
  { title: "Table Dance", image: "/images/placeholders/tabledance.jpg", href: "/table-dance" },
  { title: "Clubs", image: "/images/placeholders/club.jpg", href: "/clubs" },
  { title: "Modelos", image: "/images/placeholders/models.jpg", href: "/modelos" },
  { title: "Eventos", image: "/images/placeholders/events.jpg", href: "/eventos" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Hero / Bienvenida */}
      <div className="relative h-[60vh] flex items-center justify-center text-center px-6">
        <div className="z-20 animate-float">
          <h1 className="text-6xl md:text-8xl font-playfair text-transparent bg-clip-text bg-gradient-to-b from-vip-goldLight via-vip-gold to-vip-goldDark mb-6 tracking-widest drop-shadow-[0_0_20px_rgba(191,149,63,0.5)]">
            VENUZ
          </h1>
          <p className="text-xl md:text-2xl text-vip-goldLight/80 max-w-lg mx-auto font-light tracking-wide mb-8">
            Tu refugio nocturno exclusivo en Puerto Vallarta
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <LuxuryButton onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}>
              Explorar ahora
            </LuxuryButton>
          </div>
        </div>
      </div>

      {/* Categorías / Feed */}
      <div className="container mx-auto px-4 py-12 pb-32">
        <h2 className="text-3xl font-playfair text-vip-goldLight/70 mb-8 border-b border-vip-gold/20 pb-2">
          Experiencias Exclusivas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categorias.map((cat, i) => (
            <LuxuryCard key={cat.title} className="aspect-[3/4]">
              <div className="relative w-full h-full group">
                {/* Fallback Image */}
                <div className="absolute inset-0 bg-vip-black/80 flex items-center justify-center text-vip-gold/20">
                  <span className="text-4xl">💎</span>
                </div>

                {/* Placeholder image logic - Using absolute URL if needed or local */}
                {/* <Image 
                    src={cat.image} 
                    alt={cat.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                /> */}

                <div className="absolute inset-0 bg-gradient-to-t from-vip-black via-vip-purple/30 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="text-2xl font-playfair text-vip-goldLight drop-shadow-lg transform translation-all duration-300 group-hover:-translate-y-2">
                    {cat.title}
                  </h3>
                  <div className="w-12 h-1 bg-vip-gold rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </div>
              </div>
            </LuxuryCard>
          ))}
        </div>
      </div>
    </div>
  );
}

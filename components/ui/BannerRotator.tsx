"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BANNERS = [
    {
        imageUrl: "/backgrounds/Gemini_Generated_Image_161hu0161hu0161h.png",
        linkUrl: "https://ejemplo-afiliado.com/promo1",
        alt: "Promo Exclusiva VENUZ"
    },
    {
        imageUrl: "/backgrounds/Gemini_Generated_Image_acy9fvacy9fvacy9.png",
        linkUrl: "https://ejemplo-afiliado.com/promo2",
        alt: "Bono de Bienvenida"
    },
    {
        imageUrl: "/backgrounds/Gemini_Generated_Image_as7lv3as7lv3as7l.png",
        linkUrl: "https://ejemplo-afiliado.com/promo3",
        alt: "Evento Especial"
    }
];

export default function BannerRotator() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (BANNERS.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
        }, 7000);
        return () => clearInterval(interval);
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1));
    };

    const banner = BANNERS[currentIndex];

    if (!banner) return null;

    return (
        <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] bg-black group overflow-hidden border-b-4 border-pink-600/50 shadow-[0_10px_40px_rgba(255,0,100,0.2)]">
            <a
                href={banner.linkUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block w-full h-full relative"
            >
                {/* Image */}
                <img
                    src={banner.imageUrl}
                    alt={banner.alt}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-in-out group-hover:scale-105"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                {/* Ad Label */}
                <span className="absolute top-4 right-4 px-3 py-1 bg-black/60 text-[10px] text-white/70 rounded backdrop-blur-sm uppercase tracking-wider border border-white/10">
                    Sponsor
                </span>
            </a>

            {/* Navigation Arrows - Cyan Neon Glow */}
            <button
                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-cyan-400 border border-cyan-500/50 transition-all hover:scale-110 hover:shadow-[0_0_20px_cyan] backdrop-blur-md z-30 group/btn"
                aria-label="Anterior"
            >
                <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]" />
            </button>

            <button
                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-cyan-400 border border-cyan-500/50 transition-all hover:scale-110 hover:shadow-[0_0_20px_cyan] backdrop-blur-md z-30 group/btn"
                aria-label="Siguiente"
            >
                <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]" />
            </button>
        </div>
    );
}

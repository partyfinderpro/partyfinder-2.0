"use client";

import { useState, useEffect } from 'react';

// Banners de Afiliados (Reemplaza con tus URLs reales en el futuro)
// Usamos imágenes locales temporales que tienes en /public/backgrounds para demo
// hasta que pongas tus banners reales.
const BANNERS = [
    {
        imageUrl: "/backgrounds/Gemini_Generated_Image_161hu0161hu0161h.png", // Demo
        linkUrl: "https://ejemplo-afiliado.com/promo1",
        alt: "Promo Exclusiva VENUZ"
    },
    {
        imageUrl: "/backgrounds/Gemini_Generated_Image_acy9fvacy9fvacy9.png", // Demo
        linkUrl: "https://ejemplo-afiliado.com/promo2",
        alt: "Bono de Bienvenida"
    },
    {
        imageUrl: "/backgrounds/Gemini_Generated_Image_as7lv3as7lv3as7l.png", // Demo
        linkUrl: "https://ejemplo-afiliado.com/promo3",
        alt: "Evento Especial"
    }
];

export default function BannerRotator() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // Si hay menos de 2 banners, no rotar
        if (BANNERS.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
        }, 7000); // 7 segundos

        return () => clearInterval(interval);
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1));
    };

    const banner = BANNERS[currentIndex];

    if (!banner) return null; // Safety check

    return (
        <div
            className="relative w-full h-[140px] md:h-[220px] overflow-hidden group z-20"
            style={{
                boxShadow: '0 4px 30px rgba(0, 255, 255, 0.15)', // Sombra Cyan sutil
                borderBottom: '1px solid rgba(0, 255, 255, 0.3)' // Borde Cyan sutil
            }}
        >
            <a
                href={banner.linkUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block w-full h-full relative"
            >
                {/* Imagen del Banner con efecto Zoom suave al hover */}
                <img
                    src={banner.imageUrl}
                    alt={banner.alt}
                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                />

                {/* Overlay sutil para integrar con tema oscuro */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Etiqueta "Patrocinado" discreta */}
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-[10px] text-white/50 rounded backdrop-blur-sm uppercase tracking-wider">
                    Ad
                </span>
            </a>

            {/* Navegación con Flechas Laterales (Cyan Neón) */}
            <button
                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-cyan-400 hover:text-cyan-200 transition-all hover:scale-110 backdrop-blur-sm border border-cyan-500/30"
                aria-label="Anterior"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                </svg>
            </button>

            <button
                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-cyan-400 hover:text-cyan-200 transition-all hover:scale-110 backdrop-blur-sm border border-cyan-500/30"
                aria-label="Siguiente"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                </svg>
            </button>
        </div>
    );
}

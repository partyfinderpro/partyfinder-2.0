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

    const banner = BANNERS[currentIndex];

    if (!banner) return null; // Safety check

    return (
        <div
            className="relative w-full h-[120px] md:h-[180px] overflow-hidden group mb-6 z-20"
            style={{
                boxShadow: '0 4px 25px rgba(255, 0, 170, 0.25)',
                borderBottom: '2px solid rgba(255, 0, 170, 0.4)'
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

            {/* Indicadores (Dots) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
                {BANNERS.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex
                                ? 'bg-[#ff00aa] w-6 shadow-[0_0_8px_#ff00aa]'
                                : 'bg-white/30 hover:bg-white/60'
                            }`}
                        aria-label={`Ver banner ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

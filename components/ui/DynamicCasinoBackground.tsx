"use client";

/* ==========================================================================
   DYNAMIC CASINO BACKGROUND - VENUZ LUXURY EDITION
   Inspirado en: "Gates of Olympus" x "High-End Nightclub"
   Características:
   - Rotación suave de IMÁGENES o VIDEOS
   - Overlay de texturas (Ruido + Viñeta)
   - Partículas doradas flotantes (Champagne bubbles effect)
   ========================================================================== */

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { type Container, type Engine } from "@tsparticles/engine";

// 🖼️ TUS IMÁGENES DE FONDO (Poner en carpeta public/backgrounds/)
// Ejemplo: "/backgrounds/imagen1.jpg"
const BACKGROUND_IMAGES = [
    "/backgrounds/Gemini_Generated_Image_161hu0161hu0161h.png",
    "/backgrounds/Gemini_Generated_Image_acy9fvacy9fvacy9.png",
    "/backgrounds/Gemini_Generated_Image_as7lv3as7lv3as7l.png",
    "/backgrounds/Gemini_Generated_Image_pzgojzpzgojzpzgo.png",
    "/backgrounds/Gemini_Generated_Image_r5594gr5594gr559.png"
];

// ⏱️ TIEMPO DE ROTACIÓN (en milisegundos)
const ROTATION_INTERVAL = 8000; // 8 segundos

export default function DynamicCasinoBackground() {
    const [init, setInit] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Inicializar motor de partículas (solo una vez al montar)
    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    // Rotar imágenes cada X segundos (Loop Infinito)
    useEffect(() => {
        if (BACKGROUND_IMAGES.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
        }, ROTATION_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    // Configuración de Partículas Doradas (Optimizado para Móvil)
    const particlesOptions = useMemo(
        () => ({
            fullScreen: { enable: false, zIndex: 1 },
            background: { color: { value: "transparent" } },
            fpsLimit: 60, // Limita FPS para ahorrar batería
            particles: {
                color: { value: ["#bf953f", "#fcf6ba"] }, // Oro oscuro y claro
                move: {
                    enable: true,
                    direction: "top" as const, // Flotan hacia arriba
                    speed: 0.3, // Muy lento y elegante
                    random: true,
                    straight: false,
                    outModes: "out" as const,
                },
                number: {
                    density: { enable: true, width: 800, height: 800 },
                    value: 30 // Poca cantidad = Más elegante + Performance
                },
                opacity: {
                    value: 0.5,
                    animation: {
                        enable: true,
                        speed: 0.5,
                        minimumValue: 0.1,
                        sync: false
                    }
                },
                shape: { type: "circle" },
                size: {
                    value: { min: 1, max: 3 }, // Partículas pequeñas (polvo de oro)
                    animation: { enable: true, speed: 2, minimumValue: 0.1, sync: false }
                },
            },
            detectRetina: true,
        }),
        []
    );

    return (
        <div className="fixed inset-0 w-full h-full z-[-10] bg-vip-black overflow-hidden pointer-events-none">

            {/* 1. LAYER DE IMÁGENES CON TRANSICIÓN SUAVE */}
            <AnimatePresence mode="popLayout">
                <motion.img
                    key={currentIndex}
                    src={BACKGROUND_IMAGES[currentIndex]}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 0.9, scale: 1 }} // Opacidad y zoom suave
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.5, ease: "easeInOut" }} // Fade lento (2.5s)
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Casino Background"
                />
            </AnimatePresence>

            {/* 2. OVERLAY DE COLOR ATMOSFÉRICO (Gradients) - Ajustado para más visibilidad */}
            <div className="absolute inset-0 bg-gradient-to-b from-vip-black/40 via-vip-purple/10 to-vip-black/60" />

            {/* 3. TEXTURA DE RUIDO (Efecto Film Grain / Terciopelo) */}
            <div
                className="absolute inset-0 opacity-10 mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />

            {/* 4. PARTÍCULAS DORADAS */}
            {init && (
                <Particles
                    id="tsparticles"
                    options={particlesOptions}
                    className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen"
                />
            )}

            {/* 5. VIGNETTE CINEMÁTICA (Oscurece bordes) */}
            <div className="absolute inset-0 bg-radial-vignette" />

        </div>
    );
}

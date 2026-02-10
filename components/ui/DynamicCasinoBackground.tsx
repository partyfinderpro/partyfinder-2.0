"use client";

/* ==========================================================================
   DYNAMIC CASINO BACKGROUND - VENUZ LUXURY EDITION
   Inspirado en: "Gates of Olympus" x "High-End Nightclub"
   Características:
   - Rotación suave de videos cinemáticos (4k/HD)
   - Overlay de texturas (Ruido + Viñeta)
   - Partículas doradas flotantes (Champagne bubbles effect)
   ========================================================================== */

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { type Container, type Engine } from "@tsparticles/engine";

// 🎥 VIDEOS SELECCIONADOS (Royalty Free - Pexels/Coverr/Mixkit)
// Estos URLs son directos a CDNs de alta velocidad.
const LUXURY_VIDEOS = [
    // 1. Humo Púrpura y Luces (Vibe místico/Madame Destiny)
    "https://cdn.coverr.co/videos/coverr-colorful-neon-lights-in-dark-room-2759/1080p.mp4",
    // 2. Chispas Doradas / Champagne (Vibe Olympus)
    "https://cdn.coverr.co/videos/coverr-pouring-champagne-5544/1080p.mp4",
    // 3. Cartas de Poker en Slow Motion (Vibe Casino Clásico)
    "https://cdn.coverr.co/videos/coverr-playing-cards-in-casino-5546/1080p.mp4",
    // 4. Luces desenfocadas de ciudad nocturna (Vibe Nightlife Checkin)
    "https://cdn.coverr.co/videos/coverr-night-city-lights-bokeh-5677/1080p.mp4"
];

export default function DynamicCasinoBackground() {
    const [init, setInit] = useState(false);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    // Inicializar motor de partículas (solo una vez al montar)
    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    // Rotar videos cada 20 segundos (Loop Infinito)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentVideoIndex((prev) => (prev + 1) % LUXURY_VIDEOS.length);
        }, 20000); // 20 seg por video
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
        <div className="fixed inset-0 w-full h-full -z-50 bg-vip-black overflow-hidden pointer-events-none">

            {/* 1. LAYER DE VIDEOS CON TRANSICIÓN SUAVE */}
            <AnimatePresence mode="popLayout">
                <motion.video
                    key={currentVideoIndex}
                    src={LUXURY_VIDEOS[currentVideoIndex]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }} // Opacidad baja para que el texto resalte
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3, ease: "easeInOut" }} // Fade muy lento (3s)
                    className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity"
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            </AnimatePresence>

            {/* 2. OVERLAY DE COLOR ATMOSFÉRICO (Gradients) */}
            <div className="absolute inset-0 bg-gradient-to-b from-vip-black/90 via-vip-purple/40 to-vip-black/90" />

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

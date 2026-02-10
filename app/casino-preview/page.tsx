"use client";

import { useMemo } from "react";
import { LuxuryButton, LuxuryCard, LuxuryTitle } from "@/components/ui/LuxuryUI";
import { motion } from "framer-motion";
import { MonitorPlay, Trophy, CalendarCheck2, Building2 } from "lucide-react"; // Iconos

export default function LuxuryPreviewPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-20 pt-32 text-center space-y-12">

            {/* 1. SECCIÓN HERO (Título + Subtítulo) */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
            >
                <LuxuryTitle size="4xl" variant="gold">VENUZ</LuxuryTitle>
                <LuxuryTitle size="xl" variant="neon">Entretenimiento Adulto México</LuxuryTitle>

                <p className="max-w-xl mx-auto text-gray-300 font-light text-lg">
                    La guía definitiva con geolocalización e inteligencia artificial.
                    Descubre la mejor vida nocturna, perfiles verificados y clubs exclusivos.
                </p>

                {/* Botones de Acción */}
                <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                    <LuxuryButton variant="gold" onClick={() => alert("¡Bienvenido al Club!")}>
                        <Trophy className="w-5 h-5" />
                        Ingresar VIP
                    </LuxuryButton>

                    <LuxuryButton variant="neon" onClick={() => alert("Explorando...")}>
                        <MonitorPlay className="w-5 h-5" />
                        Ver Demo
                    </LuxuryButton>
                </div>
            </motion.div>

            {/* 2. GRID DE COMANDOS (Botones Categoría) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
                <LuxuryButton variant="gold" className="w-full text-sm py-4">
                    <Building2 className="w-4 h-4" /> Clubs
                </LuxuryButton>
                <LuxuryButton variant="gold" className="w-full text-sm py-4">
                    <CalendarCheck2 className="w-4 h-4" /> Eventos
                </LuxuryButton>
                <LuxuryButton variant="gold" className="w-full text-sm py-4">
                    💃 Modelos
                </LuxuryButton>
                <LuxuryButton variant="gold" className="w-full text-sm py-4">
                    🎰 Table Dance
                </LuxuryButton>
            </div>

            {/* 3. SECCIÓN DESTACADA (Cards Madame Destiny) */}
            <div className="w-full max-w-6xl space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-display font-bold text-vip-goldLight">Tendencias Hoy</h2>
                    <span className="text-vip-magenta text-sm">Ver todo →</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card 1 */}
                    <LuxuryCard delay={0.2} className="h-64">
                        <div className="flex flex-col h-full justify-end">
                            <div className="absolute inset-0 bg-cover bg-center rounded-xl opacity-60 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542200939-5698eb467d59?q=80&w=1000&auto=format&fit=crop')" }} />
                            <h3 className="relative z-10 text-2xl font-display font-bold text-vip-goldLight drop-shadow-lg">Madame Destiny's Masquerade</h3>
                            <p className="relative z-10 text-gray-200 text-sm mt-1">Sábado 14 Oct • 10:00 PM</p>
                        </div>
                    </LuxuryCard>

                    {/* Card 2 */}
                    <LuxuryCard delay={0.4} className="h-64">
                        <div className="flex flex-col h-full justify-end">
                            <div className="absolute inset-0 bg-cover bg-center rounded-xl opacity-60 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=1000&auto=format&fit=crop')" }} />
                            <h3 className="relative z-10 text-2xl font-display font-bold text-vip-goldLight drop-shadow-lg">Olympus Nights: Gold Party</h3>
                            <p className="relative z-10 text-gray-200 text-sm mt-1">Viernes 13 Oct • 11:00 PM</p>
                        </div>
                    </LuxuryCard>
                </div>
            </div>

        </div>
    );
}

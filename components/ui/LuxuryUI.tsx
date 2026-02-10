"use client";

import { motion } from "framer-motion";
import { cn } from "../../utils/cn"; // Cambio a ruta relativa para evitar problemas de alias en Vercel

/* ==========================================================================
   LUXURY UI COMPONENTS - VENUZ VIP EDITION
   Componentes reutilizables con estilos de casino de alta gama.
   ========================================================================== */

// 1. BOTÓN OLYMPUS GOLD
// ==========================================================================
export function LuxuryButton({
    children,
    onClick,
    className,
    variant = 'gold'
}: {
    children: React.ReactNode,
    onClick?: () => void,
    className?: string,
    variant?: 'gold' | 'neon'
}) {
    const baseStyles = "relative px-8 py-3 font-display font-bold tracking-widest uppercase overflow-hidden group rounded-full transition-all transform hover:scale-105 active:scale-95";

    const goldStyles = "bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#bf953f] bg-[length:200%_auto] animate-shine text-black border-2 border-[#aa771c] shadow-[0_0_20px_rgba(191,149,63,0.5)] hover:shadow-[0_0_40px_rgba(191,149,63,0.8)]";

    const neonStyles = "bg-black/80 backdrop-blur-md text-[#fcf6ba] border-2 border-[#f72585] shadow-[0_0_15px_rgba(247,37,133,0.4)] hover:shadow-[0_0_30px_rgba(247,37,133,0.6)] hover:border-[#bf953f]";

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variant === 'gold' ? goldStyles : neonStyles} ${className}`}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>

            {/* Brillo interno al hover */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
        </button>
    );
}

// 2. CARD MADAME DESTINY (Marco Ornamentado)
// ==========================================================================
export function LuxuryCard({
    children,
    className,
    delay = 0
}: {
    children: React.ReactNode,
    className?: string,
    delay?: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            className={`relative group rounded-xl p-[1px] bg-gradient-to-b from-[#bf953f] via-transparent to-[#bf953f] ${className}`}
        >
            {/* Fondo Glass oscuro */}
            <div className="relative rounded-xl bg-[#0a0510]/90 backdrop-blur-xl p-6 h-full border border-white/5 shadow-2xl group-hover:bg-[#1a0b2e]/90 transition-colors duration-500">

                {/* Esquinas Doradas Decorativas (SVG) */}
                <CornerDecoration className="absolute top-0 left-0 w-8 h-8 text-[#bf953f]" />
                <CornerDecoration className="absolute top-0 right-0 w-8 h-8 text-[#bf953f] rotate-90" />
                <CornerDecoration className="absolute bottom-0 left-0 w-8 h-8 text-[#bf953f] -rotate-90" />
                <CornerDecoration className="absolute bottom-0 right-0 w-8 h-8 text-[#bf953f] rotate-180" />

                {/* Contenido */}
                <div className="relative z-10">
                    {children}
                </div>

                {/* Glow sutil en el fondo */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#7b2cbf]/20 via-transparent to-[#bf953f]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>
        </motion.div>
    );
}

// Helper: Decoración de esquinas estilo Art Deco
function CornerDecoration({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M2 2h10v2H4v8H2V2z" />
            <circle cx="5" cy="5" r="1.5" className="text-[#fcf6ba]" />
        </svg>
    );
}

// 3. TÍTULO METÁLICO (Oro o Neón)
// ==========================================================================
export function LuxuryTitle({
    children,
    size = "xl",
    variant = "gold"
}: {
    children: string,
    size?: "lg" | "xl" | "2xl" | "4xl",
    variant?: "gold" | "neon"
}) {
    const sizes = {
        lg: "text-2xl",
        xl: "text-4xl",
        "2xl": "text-5xl",
        "4xl": "text-7xl"
    };

    const variants = {
        gold: "text-transparent bg-clip-text bg-gradient-to-b from-[#fcf6ba] via-[#bf953f] to-[#aa771c] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]",
        neon: "text-[#f72585] drop-shadow-[0_0_10px_rgba(247,37,133,0.8)]"
    };

    return (
        <h1 className={`font-display font-black tracking-tight ${sizes[size]} ${variants[variant]}`}>
            {children}
        </h1>
    );
}

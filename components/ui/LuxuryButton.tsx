"use client";

import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

interface LuxuryButtonProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: "primary" | "outline";
}

export default function LuxuryButton({
    children,
    className,
    onClick,
    variant = "primary",
}: LuxuryButtonProps) {
    const base = "relative px-6 py-3 font-playfair font-bold tracking-widest uppercase overflow-hidden rounded-full transition-all duration-500 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-vip-gold/50";

    const variants = {
        primary: "bg-gradient-to-r from-vip-gold via-vip-goldLight to-vip-gold bg-[length:200%_auto] animate-shine text-vip-black shadow-[0_0_20px_rgba(191,149,63,0.5)] hover:shadow-[0_0_40px_rgba(191,149,63,0.8)] border-2 border-vip-goldDark",
        outline: "border-2 border-vip-gold text-vip-gold hover:bg-vip-gold/10",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={cn(base, variants[variant], className)}
            onClick={onClick}
        >
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}

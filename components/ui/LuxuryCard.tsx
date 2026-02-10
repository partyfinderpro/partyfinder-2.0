"use client";

import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

interface LuxuryCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export default function LuxuryCard({ children, className, onClick }: LuxuryCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
            className={cn(
                "group relative overflow-hidden rounded-2xl bg-vip-black/60 backdrop-blur-xl border border-vip-gold/30 shadow-[0_8px_32px_rgba(191,149,63,0.15)] transition-all duration-500 hover:shadow-[0_16px_48px_rgba(191,149,63,0.3)] hover:border-vip-gold/50 cursor-pointer",
                className
            )}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}

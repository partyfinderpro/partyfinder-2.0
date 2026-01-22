"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import {
    ConcertIcon,
    BarIcon,
    ClubIcon,
    EscortIcon,
    CasinoIcon,
    PartyIcon,
    LiveIcon,
    PremiumIcon,
    HotIcon,
    getCategoryIcon,
} from "./icons/CategoryIcons";

// ============================================
// FIX #3: MegaMenu con iconos SVG premium
// Reemplaza emojis genéricos por iconos con 
// gradientes Pink/Gold de VENUZ
// ============================================

interface Category {
    id: string;
    name: string;
    description?: string;
    subcategories?: { id: string; name: string }[];
    isTemporary?: boolean; // Para distinguir eventos de lugares
}

interface MegaMenuProps {
    categories: Category[];
    selectedCategory?: string;
    onSelectCategory: (categoryId: string) => void;
    className?: string;
}

// Categorías predefinidas con iconos
const CATEGORY_CONFIG: Record<string, {
    Icon: React.FC<{ size?: number; className?: string }>;
    gradient: string;
    bgGradient: string;
}> = {
    concierto: {
        Icon: ConcertIcon,
        gradient: "from-pink-500 via-rose-400 to-amber-400",
        bgGradient: "from-pink-500/20 to-rose-500/10",
    },
    evento: {
        Icon: PartyIcon,
        gradient: "from-violet-500 via-purple-400 to-pink-400",
        bgGradient: "from-violet-500/20 to-purple-500/10",
    },
    bar: {
        Icon: BarIcon,
        gradient: "from-amber-500 via-orange-400 to-yellow-400",
        bgGradient: "from-amber-500/20 to-orange-500/10",
    },
    club: {
        Icon: ClubIcon,
        gradient: "from-purple-500 via-pink-400 to-rose-400",
        bgGradient: "from-purple-500/20 to-pink-500/10",
    },
    escort: {
        Icon: EscortIcon,
        gradient: "from-pink-500 via-rose-400 to-red-400",
        bgGradient: "from-pink-500/20 to-rose-500/10",
    },
    modelo: {
        Icon: EscortIcon,
        gradient: "from-pink-500 via-rose-400 to-red-400",
        bgGradient: "from-pink-500/20 to-rose-500/10",
    },
    casino: {
        Icon: CasinoIcon,
        gradient: "from-amber-500 via-red-400 to-rose-400",
        bgGradient: "from-amber-500/20 to-red-500/10",
    },
    live: {
        Icon: LiveIcon,
        gradient: "from-red-500 via-rose-400 to-pink-400",
        bgGradient: "from-red-500/20 to-rose-500/10",
    },
    premium: {
        Icon: PremiumIcon,
        gradient: "from-amber-400 via-yellow-300 to-amber-400",
        bgGradient: "from-amber-400/20 to-yellow-400/10",
    },
    destacado: {
        Icon: HotIcon,
        gradient: "from-orange-500 via-red-400 to-rose-400",
        bgGradient: "from-orange-500/20 to-red-500/10",
    },
};

const getConfig = (categoryId: string) => {
    const normalized = categoryId.toLowerCase();
    return CATEGORY_CONFIG[normalized] || {
        Icon: PartyIcon,
        gradient: "from-pink-500 to-rose-400",
        bgGradient: "from-pink-500/20 to-rose-500/10",
    };
};

export default function MegaMenu({
    categories,
    selectedCategory,
    onSelectCategory,
    className = "",
}: MegaMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const selectedConfig = selectedCategory ? getConfig(selectedCategory) : null;
    const SelectedIcon = selectedConfig?.Icon || PartyIcon;

    return (
        <div className={`relative ${className}`}>
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-3
          px-4 py-3 rounded-2xl
          bg-white/5 hover:bg-white/10
          border border-white/10 hover:border-pink-500/30
          transition-all duration-300
          group
        `}
            >
                {/* Selected Category Icon */}
                <div className={`
          w-8 h-8 rounded-lg
          bg-gradient-to-br ${selectedConfig?.bgGradient || "from-pink-500/20 to-rose-500/10"}
          flex items-center justify-center
        `}>
                    <SelectedIcon size={20} />
                </div>

                <span className="text-white/90 font-medium">
                    {selectedCategory
                        ? categories.find(c => c.id === selectedCategory)?.name || "Categorías"
                        : "Todas las categorías"
                    }
                </span>

                <ChevronDown className={`
          w-5 h-5 text-white/50
          transition-transform duration-300
          ${isOpen ? "rotate-180" : ""}
        `} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="
                absolute top-full left-0 mt-2
                w-80 sm:w-96
                p-4
                bg-black/95 backdrop-blur-xl
                border border-white/10
                rounded-3xl
                shadow-2xl shadow-pink-500/10
                z-50
              "
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                                <h3 className="text-lg font-bold text-white">Categorías</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* "Todas" Option */}
                            <motion.button
                                whileHover={{ x: 4 }}
                                onClick={() => {
                                    onSelectCategory("");
                                    setIsOpen(false);
                                }}
                                className={`
                  w-full flex items-center gap-3
                  p-3 rounded-xl mb-2
                  transition-all duration-200
                  ${!selectedCategory
                                        ? "bg-gradient-to-r from-pink-500/20 to-rose-500/10 border border-pink-500/30"
                                        : "hover:bg-white/5"
                                    }
                `}
                            >
                                <div className="
                  w-10 h-10 rounded-xl
                  bg-gradient-to-br from-pink-500/20 to-purple-500/20
                  flex items-center justify-center
                  border border-white/10
                ">
                                    <span className="text-lg">✨</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-medium">Todas</p>
                                    <p className="text-xs text-white/50">Ver todo el contenido</p>
                                </div>
                            </motion.button>

                            {/* Divider */}
                            <div className="h-px bg-white/10 my-3" />

                            {/* Categories Grid */}
                            <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                {categories.map((category) => {
                                    const config = getConfig(category.id);
                                    const Icon = config.Icon;
                                    const isSelected = selectedCategory === category.id;
                                    const isHovered = hoveredCategory === category.id;

                                    return (
                                        <motion.button
                                            key={category.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onHoverStart={() => setHoveredCategory(category.id)}
                                            onHoverEnd={() => setHoveredCategory(null)}
                                            onClick={() => {
                                                onSelectCategory(category.id);
                                                setIsOpen(false);
                                            }}
                                            className={`
                        relative flex flex-col items-center
                        p-4 rounded-2xl
                        transition-all duration-300
                        overflow-hidden
                        ${isSelected
                                                    ? `bg-gradient-to-br ${config.bgGradient} border border-pink-500/40`
                                                    : "bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                                                }
                      `}
                                        >
                                            {/* Background Glow on Hover */}
                                            <AnimatePresence>
                                                {(isHovered || isSelected) && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className={`
                              absolute inset-0
                              bg-gradient-to-br ${config.bgGradient}
                              opacity-50
                            `}
                                                    />
                                                )}
                                            </AnimatePresence>

                                            {/* Icon */}
                                            <div className={`
                        relative z-10
                        w-12 h-12 rounded-xl mb-2
                        bg-gradient-to-br ${config.bgGradient}
                        flex items-center justify-center
                        border border-white/10
                        transition-transform duration-300
                        ${isHovered ? "scale-110" : ""}
                      `}>
                                                <Icon size={28} />
                                            </div>

                                            {/* Name */}
                                            <span className="relative z-10 text-sm font-medium text-white text-center">
                                                {category.name}
                                            </span>

                                            {/* Temporary Badge (para eventos) */}
                                            {category.isTemporary && (
                                                <span className="
                          relative z-10
                          mt-1 px-2 py-0.5
                          text-[10px] font-semibold
                          bg-amber-500/20 text-amber-400
                          rounded-full
                        ">
                                                    Evento
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Footer hint */}
                            <div className="mt-4 pt-3 border-t border-white/10">
                                <p className="text-xs text-white/40 text-center">
                                    Los iconos distinguen entre lugares permanentes y eventos temporales
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(236, 72, 153, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(236, 72, 153, 0.7);
        }
      `}</style>
        </div>
    );
}

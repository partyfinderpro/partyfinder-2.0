"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Flame, Menu, X, MapPin, Search } from "lucide-react";

interface HeaderProps {
    notificationCount?: number;
    onMenuClick?: () => void;
    onNotificationClick?: () => void;
    onHighlightsClick?: () => void;
    currentLocation?: string;
}

export default function Header({
    notificationCount = 0,
    onMenuClick,
    onNotificationClick,
    onHighlightsClick,
    currentLocation = "Puerto Vallarta",
}: HeaderProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-500 ease-out
        ${isScrolled
                    ? "bg-black/80 backdrop-blur-xl border-b border-pink-500/20"
                    : "bg-gradient-to-b from-black/90 to-transparent"
                }
      `}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">

                    {/* Logo + Location */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 -ml-2 text-white/80 hover:text-pink-400 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <motion.div
                            className="flex flex-col"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                                <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                                    VENUZ
                                </span>
                            </h1>
                            <div className="flex items-center gap-1 text-xs text-white/50">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[120px] sm:max-w-none">
                                    {currentLocation}
                                </span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Actions - ESPACIADO CORREGIDO */}
                    <div className="flex items-center">
                        {/* 
              FIX #1: Espaciado dinámico
              - Móvil: gap-2 (8px) 
              - Tablet: gap-3 (12px)
              - Desktop: gap-4 (16px)
              Esto evita el amontonamiento en tablets/laptops pequeñas
            */}
                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">

                            {/* Search Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowSearch(!showSearch)}
                                className="
                  relative p-2.5 sm:p-3
                  rounded-xl
                  bg-white/5 hover:bg-white/10
                  border border-white/10 hover:border-pink-500/30
                  transition-all duration-300
                  group
                "
                            >
                                <Search className="w-5 h-5 text-white/70 group-hover:text-pink-400 transition-colors" />
                            </motion.button>

                            {/* Notification Bell */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onNotificationClick}
                                className="
                  relative p-2.5 sm:p-3
                  rounded-xl
                  bg-white/5 hover:bg-white/10
                  border border-white/10 hover:border-pink-500/30
                  transition-all duration-300
                  group
                "
                            >
                                <Bell className="w-5 h-5 text-white/70 group-hover:text-pink-400 transition-colors" />

                                {/* Notification Badge */}
                                <AnimatePresence>
                                    {notificationCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="
                        absolute -top-1 -right-1
                        min-w-[20px] h-5 px-1.5
                        flex items-center justify-center
                        text-xs font-bold text-white
                        bg-gradient-to-r from-pink-500 to-rose-500
                        rounded-full
                        shadow-lg shadow-pink-500/50
                      "
                                        >
                                            {notificationCount > 99 ? "99+" : notificationCount}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {/* Pulse Animation */}
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full animate-ping opacity-30" />
                                )}
                            </motion.button>

                            {/* Highlights/Destacados Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onHighlightsClick}
                                className="
                  relative p-2.5 sm:p-3
                  rounded-xl
                  bg-gradient-to-br from-amber-500/20 to-pink-500/20
                  hover:from-amber-500/30 hover:to-pink-500/30
                  border border-amber-500/30 hover:border-amber-400/50
                  transition-all duration-300
                  group
                  overflow-hidden
                "
                            >
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                                <Flame className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors relative z-10" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Overlay */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-pink-500/20 p-4"
                    >
                        <div className="max-w-2xl mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                type="text"
                                placeholder="Buscar eventos, lugares, modelos..."
                                autoFocus
                                className="
                  w-full py-3 pl-12 pr-12
                  bg-white/5 border border-white/10
                  rounded-2xl
                  text-white placeholder-white/40
                  focus:outline-none focus:border-pink-500/50
                  transition-colors
                "
                            />
                            <button
                                onClick={() => setShowSearch(false)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

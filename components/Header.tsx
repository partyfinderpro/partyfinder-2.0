"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Flame, Menu, X, MapPin, Search, ChevronDown, RefreshCw } from "lucide-react";
import { detectUserCity, saveUserCity, getStoredCity } from "@/lib/geo";
import { LiveNowCounter } from "@/components/LiveNowCounter";

interface HeaderProps {
    notificationCount?: number;
    onMenuClick?: () => void;
    onNotificationClick?: () => void;
    onHighlightsClick?: () => void;
    onRefresh?: () => void;
    onSearch?: (query: string) => void;
    onCityChange?: (city: string) => void;
}

const MEXICO_CITIES = ['Todas', 'Ubicación Actual', 'CDMX', 'Guadalajara', 'Monterrey', 'Cancún', 'Puerto Vallarta', 'Tulum'];

export default function Header({
    notificationCount = 0,
    onMenuClick,
    onNotificationClick,
    onHighlightsClick,
    onRefresh,
    onSearch,
    onCityChange,
}: HeaderProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [city, setCity] = useState("Todas");
    const [showCitySelector, setShowCitySelector] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);

        // Inicializar ciudad
        const stored = localStorage.getItem('venuz_user_city') || 'Todas';
        setCity(stored);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleCityChange = (newCity: string) => {
        setCity(newCity);
        setShowCitySelector(false);
        if (onCityChange) onCityChange(newCity);
    };

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

                    {/* Logo + Location Selector */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 -ml-2 text-white/80 hover:text-pink-400 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-2xl sm:text-3xl font-black tracking-tight"
                            >
                                <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                                    VENUZ
                                </span>
                            </motion.h1>

                            {/* Selector de Ciudad */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowCitySelector(!showCitySelector)}
                                    className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
                                >
                                    <MapPin className="w-3 h-3 text-pink-500" />
                                    <span className="truncate max-w-[120px] sm:max-w-none font-medium">
                                        {city}
                                    </span>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${showCitySelector ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {showCitySelector && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 mt-2 w-48 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                                        >
                                            {MEXICO_CITIES.map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => handleCityChange(c)}
                                                    className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/10 ${city === c ? 'text-pink-500 bg-white/5 font-bold' : 'text-white/70'
                                                        }`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Social Proof Counter - Desktop Only */}
                        <div className="hidden md:block ml-6">
                            <LiveNowCounter size="sm" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowSearch(!showSearch)}
                            className="p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 group transition-all"
                        >
                            <Search className="w-5 h-5 text-white/70 group-hover:text-pink-400 transition-colors" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onNotificationClick}
                            className="relative p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 group transition-all"
                        >
                            <Bell className="w-5 h-5 text-white/70 group-hover:text-pink-400 transition-colors" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold text-white bg-pink-500 rounded-full shadow-lg">
                                    {notificationCount}
                                </span>
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onHighlightsClick}
                            className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-pink-500/20 border border-amber-500/30 group transition-all"
                        >
                            <Flame className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onRefresh}
                            className="p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 group transition-all"
                            title="Actualizar Feed"
                        >
                            <RefreshCw className="w-5 h-5 text-white/70 group-hover:text-pink-400 transition-colors group-active:animate-spin" />
                        </motion.button>
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
                                onChange={(e) => onSearch?.(e.target.value)}
                                className="w-full py-3 pl-12 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-pink-500/50 transition-colors"
                            />
                            <button
                                onClick={() => {
                                    setShowSearch(false);
                                    onSearch?.("");
                                }}
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

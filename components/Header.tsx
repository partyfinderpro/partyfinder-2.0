"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Flame, Menu, X, MapPin, Search, ChevronDown, RefreshCw } from "lucide-react";
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
    const [showSearch, setShowSearch] = useState(false);
    const [city, setCity] = useState("Todas");
    const [showCitySelector, setShowCitySelector] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Initialize city from local storage
    useEffect(() => {
        const stored = localStorage.getItem('venuz_user_city') || 'Todas';
        setCity(stored);
    }, []);

    const handleCityChange = (newCity: string) => {
        setCity(newCity);
        setShowCitySelector(false);
        if (onCityChange) onCityChange(newCity);
    };

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 h-[60px] sm:h-[70px] bg-gradient-to-r from-purple-950 via-purple-900 to-pink-950 shadow-lg flex items-center justify-between px-4 transition-all duration-300"
        >
            {/* LEFT: Logo + Online Badge + Location */}
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button - Visible mainly on smaller screens */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-white/80 hover:text-pink-400 transition-colors mr-1"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Logo */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-pink-500 drop-shadow-[0_0_10px_#ff00aa] tracking-tight cursor-default">
                    VENUZ
                </h1>

                {/* Online Badge - Hidden on very small screens, visible on md+ */}
                <div className="hidden md:flex items-center">
                    <span className="bg-red-600/90 px-3 py-0.5 rounded-full text-white text-xs font-bold border border-red-500/50 shadow-md">
                        <LiveNowCounter size="sm" />
                    </span>
                </div>

                {/* Location - With Dropdown */}
                <div className="relative flex items-center text-gray-300 text-xs sm:text-sm font-medium">
                    <MapPin className="w-3.5 h-3.5 text-pink-500 mr-1" />
                    <button
                        onClick={() => setShowCitySelector(!showCitySelector)}
                        className="flex items-center hover:text-white transition-colors gap-1 truncate max-w-[100px] sm:max-w-[150px]"
                    >
                        {city}
                        <ChevronDown className={`w-3 h-3 transition-transform ${showCitySelector ? 'rotate-180' : ''}`} />
                    </button>

                    {/* City Dropdown */}
                    <AnimatePresence>
                        {showCitySelector && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-3 w-48 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                            >
                                {MEXICO_CITIES.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => handleCityChange(c)}
                                        className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/10 ${city === c ? 'text-pink-500 bg-white/5 font-bold' : 'text-white/70'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* RIGHT: Icons (Search, Notification, Fire, Refresh) */}
            <div className="flex items-center gap-3 sm:gap-5 text-gray-300">
                {/* Search */}
                <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="hover:text-white hover:scale-110 transition-transform"
                    aria-label="Buscar"
                >
                    <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="hover:text-white hover:scale-110 transition-transform relative"
                        aria-label="Notificaciones"
                    >
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                        {notificationCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center border border-black">
                                {notificationCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-3 w-80 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
                            >
                                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-pink-500" />
                                        Notificaciones
                                    </h3>
                                    <button onClick={() => setShowNotifications(false)} className="text-white/50 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-6 text-center text-white/70 text-sm">
                                    <p>No tienes notificaciones nuevas.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Trending / Fire */}
                <button
                    onClick={onHighlightsClick}
                    className="hover:text-orange-400 hover:scale-110 transition-transform"
                    aria-label="Tendencias"
                >
                    <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                </button>

                {/* Refresh */}
                <button
                    onClick={onRefresh}
                    className="hover:text-cyan-400 hover:scale-110 transition-transform group"
                    aria-label="Refrescar"
                >
                    <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 group-active:animate-spin" />
                </button>
            </div>

            {/* Search Overlay (Absolute over header or fixed) */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-pink-500/20 p-4 shadow-2xl"
                    >
                        <div className="max-w-3xl mx-auto relative flex items-center gap-2">
                            <Search className="w-5 h-5 text-pink-500" />
                            <input
                                type="text"
                                placeholder="Buscar eventos, lugares, modelos..."
                                onChange={(e) => onSearch?.(e.target.value)}
                                autoFocus
                                className="flex-1 bg-transparent border-none text-white placeholder-white/40 focus:outline-none text-lg"
                            />
                            <button onClick={() => setShowSearch(false)}>
                                <X className="w-5 h-5 text-white/60 hover:text-white" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

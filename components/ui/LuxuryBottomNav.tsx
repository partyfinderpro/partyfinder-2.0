"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Search, Heart, User, Sparkles } from "lucide-react";
import { cn } from "../../utils/cn";

export default function LuxuryBottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { name: "Inicio", path: "/", icon: Home },
        { name: "Explorar", path: "/explorar", icon: Search },
        { name: "VIP", path: "/casino-vip", icon: Sparkles, isSpecial: true }, // Botón central destacado
        { name: "Favoritos", path: "/favoritos", icon: Heart },
        { name: "Perfil", path: "/perfil", icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 lg:hidden">
            {/* Container Glassmorphism */}
            <div className="absolute inset-0 bg-gradient-to-t from-vip-black via-vip-black/90 to-transparent pointer-events-none" />

            <div className="relative bg-vip-black/80 backdrop-blur-xl border border-vip-gold/20 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-around h-16 px-2 mx-auto max-w-md">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.name}
                            onClick={() => router.push(item.path)}
                            className="relative flex flex-col items-center justify-center w-14 h-full group"
                        >
                            {/* Indicador Activo (Glow) */}
                            {isActive && (
                                <motion.div
                                    layoutId="nav-glow"
                                    className="absolute inset-0 bg-vip-gold/10 rounded-xl blur-md"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            {/* Icono */}
                            <div className={cn(
                                "relative z-10 transition-all duration-300",
                                item.isSpecial ? "-mt-6" : "",
                                isActive ? "text-vip-gold scale-110 drop-shadow-[0_0_8px_rgba(191,149,63,0.6)]" : "text-gray-400 group-hover:text-vip-goldLight"
                            )}>
                                {item.isSpecial ? (
                                    <div className="bg-gradient-to-b from-vip-gold to-vip-goldDark p-3 rounded-full shadow-[0_0_15px_rgba(191,149,63,0.4)] border-2 border-vip-black">
                                        <Icon className="w-6 h-6 text-black" />
                                    </div>
                                ) : (
                                    <Icon className="w-5 h-5" />
                                )}
                            </div>

                            {/* Etiqueta */}
                            {!item.isSpecial && (
                                <span className={cn(
                                    "text-[10px] mt-1 font-medium transition-colors duration-300",
                                    isActive ? "text-vip-gold" : "text-gray-500"
                                )}>
                                    {item.name}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

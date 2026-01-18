'use client';

import { Home, Flame, MapPin, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

const navItems = [
    { icon: Home, label: 'Inicio', href: '/', badge: null },
    { icon: Flame, label: 'Hot', href: '/hot', badge: '3' },
    { icon: MapPin, label: 'Mapa', href: '/map', badge: null },
    { icon: Star, label: 'Guardados', href: '/saved', badge: null },
    { icon: User, label: 'Perfil', href: '/profile', badge: null },
];

export default function BottomNavigation() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Backdrop blur */}
            <div className="absolute inset-0 bg-deep-black/80 backdrop-blur-xl border-t border-white/10"></div>

            {/* Navigation items */}
            <div className="relative flex items-center justify-around px-2 py-3 safe-area-bottom">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all no-select"
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-casino/20 rounded-xl"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}

                            {/* Icon with badge */}
                            <div className="relative">
                                <Icon
                                    className={cn(
                                        "w-6 h-6 transition-colors relative z-10",
                                        isActive ? "text-neon-purple" : "text-gray-400"
                                    )}
                                />
                                {item.badge && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                        {item.badge}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "text-xs font-medium relative z-10 transition-colors",
                                    isActive ? "text-neon-purple" : "text-gray-400"
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

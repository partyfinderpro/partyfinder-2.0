"use client";

import { cn } from "../../utils/cn";
import { Home, Search, Heart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Buscar", href: "/casino-vip" }, // Update to point to preview temporarily or search page
    { icon: Heart, label: "Favoritos", href: "/favorites" },
    { icon: User, label: "Perfil", href: "/profile" },
];

export default function LuxuryBottomNav() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // Prevent hydration mismatch

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe-area-inset-bottom">
            <div className="mx-auto max-w-md px-4 pb-4">
                <div className="flex items-center justify-around rounded-2xl bg-vip-black/70 backdrop-blur-2xl border border-vip-gold/20 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] py-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300",
                                    isActive
                                        ? "text-vip-gold shadow-[0_0_15px_rgba(191,149,63,0.5)] bg-vip-gold/10"
                                        : "text-gray-400 hover:text-vip-gold hover:bg-vip-gold/5"
                                )}
                            >
                                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

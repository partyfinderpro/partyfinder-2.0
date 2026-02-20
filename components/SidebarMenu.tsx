'use client';

import {
    Home,
    Flame,
    MapPin,
    Heart,
    Sparkles,
    Map as MapIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCategoryIcon } from './icons/CategoryIcons';

interface SidebarMenuProps {
    lang: string;
    region?: string;
    activeMenu?: string;
    onMenuChange?: (menu: string) => void;
    categories?: any[];
    selectedCategory?: string;
    onCategorySelect?: (categoryId: string) => void;
}

export default function SidebarMenu({
    lang,
    region = 'mexico',
    activeMenu,
    onMenuChange,
    categories = [],
    selectedCategory,
    onCategorySelect
}: SidebarMenuProps) {
    const tNav = useTranslations('nav');
    const tVenue = useTranslations('venue');
    const pathname = usePathname();

    const menuItems = [
        { id: 'inicio', label: tNav('explore'), icon: Home, href: `/${lang}` },
        { id: 'mapa', label: 'Mapa Interactivo', icon: MapIcon, href: `/${lang}/${region}/map` },
        { id: 'tendencias', label: tNav('trending'), icon: Flame, href: `/${lang}?active=trending`, color: 'text-orange-400' },
        { id: 'cerca', label: tNav('near_me'), icon: MapPin, href: `/${lang}?active=near`, color: 'text-blue-400' },
        { id: 'favoritos', label: tNav('favorites'), icon: Heart, href: `/${lang}/profile`, color: 'text-pink-500' },
    ];

    return (
        <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <div className="sticky top-24 space-y-4 px-4">
                {/* Main Menu */}
                <div className="venuz-card p-4">
                    <div className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            // Check if active based on pathname or state
                            const isActive = (item.id === 'inicio' && pathname === `/${lang}`) ||
                                (item.id === 'mapa' && pathname?.includes('/map')) ||
                                activeMenu === item.id;

                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => onMenuChange?.(item.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm flex items-center gap-3 ${isActive
                                        ? 'text-white bg-venuz-pink/20 border border-venuz-pink/30'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${item.color || ''}`} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                    <div className="venuz-card p-4">
                        <h3 className="text-sm font-semibold mb-3 text-gold-gradient flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            {tNav('categories_title')}
                        </h3>
                        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                            <button
                                onClick={() => onCategorySelect?.('')}
                                className={`w-full text-left px-3 py-2 rounded-lg transition text-xs flex items-center gap-2 ${selectedCategory === ''
                                    ? 'bg-venuz-pink text-white font-semibold'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span>🌟</span>
                                Todo
                            </button>
                            {categories.map(cat => {
                                const Icon = getCategoryIcon(cat.id);
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => onCategorySelect?.(cat.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition text-xs flex items-center gap-2 ${selectedCategory === cat.id
                                            ? 'bg-venuz-pink text-white font-semibold'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <Icon size={14} />
                                        {cat.name}
                                        {cat.isTemporary && (
                                            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                                                Live
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

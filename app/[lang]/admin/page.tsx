'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Stats {
    total: number;
    byCategory: Record<string, number>;
    bySource: Record<string, number>;
    withImages: number;
    withLocation: number;
    premium: number;
    verified: number;
}

interface ContentItem {
    id: string;
    title: string;
    category?: string;
    affiliate_source?: string;
    likes: number;
    views: number;
    rating?: number;
    image_url?: string;
    is_premium?: boolean;
    is_verified?: boolean;
    created_at: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [items, setItems] = useState<ContentItem[]>([]);
    const [activeTab, setActiveTab] = useState<'trending' | 'recent' | 'noImage'>('trending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            setLoading(true);
            try {
                const { data, count } = await supabase
                    .from('content')
                    .select('*', { count: 'exact' });

                if (!data) return;

                const categories: Record<string, number> = {};
                const sources: Record<string, number> = {};
                let withImages = 0;
                let withLocation = 0;
                let premium = 0;
                let verified = 0;

                data.forEach((item: any) => {
                    if (item.category) {
                        categories[item.category] = (categories[item.category] || 0) + 1;
                    }
                    if (item.affiliate_source) {
                        sources[item.affiliate_source] = (sources[item.affiliate_source] || 0) + 1;
                    }
                    if (item.image_url) withImages++;
                    if (item.latitude && item.longitude) withLocation++;
                    if (item.is_premium) premium++;
                    if (item.is_verified) verified++;
                });

                setStats({
                    total: count || data.length,
                    byCategory: categories,
                    bySource: sources,
                    withImages,
                    withLocation,
                    premium,
                    verified,
                });

                // Sort items
                sortAndSetItems(data, activeTab);
            } catch (err) {
                console.error('Error loading stats:', err);
            } finally {
                setLoading(false);
            }
        }

        loadStats();
    }, []);

    const sortAndSetItems = (allItems: any[], tab: typeof activeTab) => {
        let sorted: ContentItem[];
        switch (tab) {
            case 'trending':
                sorted = [...allItems].sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
                break;
            case 'recent':
                sorted = [...allItems].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                break;
            case 'noImage':
                sorted = allItems.filter(item => !item.image_url);
                break;
            default:
                sorted = allItems;
        }
        setItems(sorted.slice(0, 50).map(item => ({
            ...item,
            likes: item.likes || 0,
            views: item.views || 0,
        })));
    };

    const handleExportCSV = () => {
        if (!items.length) return;

        const headers = ['ID', 'Título', 'Categoría', 'Fuente', 'Likes', 'Views', 'Premium', 'Verificado'];
        const rows = items.map(item => [
            item.id,
            item.title,
            item.category || '',
            item.affiliate_source || '',
            item.likes,
            item.views,
            item.is_premium ? 'Sí' : 'No',
            item.is_verified ? 'Sí' : 'No',
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `venuz-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    📊 VENUZ Admin Panel
                </h1>
                <p className="text-gray-400 mt-2">
                    Dashboard de contenido y métricas
                </p>
            </header>

            {/* Stats Cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Total Registros"
                    value={stats?.total || 0}
                    icon="📦"
                    color="from-blue-500 to-cyan-500"
                />
                <StatCard
                    title="Con Imágenes"
                    value={stats?.withImages || 0}
                    subtitle={`${((stats?.withImages || 0) / (stats?.total || 1) * 100).toFixed(1)}%`}
                    icon="🖼️"
                    color="from-green-500 to-emerald-500"
                />
                <StatCard
                    title="Premium"
                    value={stats?.premium || 0}
                    icon="⭐"
                    color="from-yellow-500 to-orange-500"
                />
                <StatCard
                    title="Verificados"
                    value={stats?.verified || 0}
                    icon="✓"
                    color="from-pink-500 to-purple-500"
                />
            </section>

            {/* Distribution */}
            <section className="grid md:grid-cols-2 gap-6 mb-8">
                {/* By Category */}
                <div className="bg-gray-800 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Por Categoría</h3>
                    <div className="space-y-3">
                        {stats?.byCategory && Object.entries(stats.byCategory)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 8)
                            .map(([cat, count]) => (
                                <div key={cat}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="capitalize">{cat}</span>
                                        <span>{count}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                                            style={{ width: `${(count / (stats?.total || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* By Source */}
                <div className="bg-gray-800 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Por Fuente</h3>
                    <div className="space-y-2">
                        {stats?.bySource && Object.entries(stats.bySource)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 8)
                            .map(([source, count]) => (
                                <div key={source} className="flex justify-between items-center">
                                    <span className="text-gray-300">{source}</span>
                                    <span className="text-sm bg-gray-700 px-2 py-1 rounded">{count}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </section>

            {/* Content Table */}
            <section className="bg-gray-800 rounded-xl overflow-hidden mb-8">
                <div className="flex border-b border-gray-700">
                    {[
                        { id: 'trending', label: '🔥 Trending' },
                        { id: 'recent', label: '🆕 Recientes' },
                        { id: 'noImage', label: '🚫 Sin Imagen' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`px-6 py-4 font-medium transition-colors ${activeTab === tab.id
                                ? 'text-pink-400 border-b-2 border-pink-400 bg-gray-700/50'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="text-left p-4 font-medium">Título</th>
                                <th className="text-left p-4 font-medium">Categoría</th>
                                <th className="text-left p-4 font-medium">Fuente</th>
                                <th className="text-right p-4 font-medium">Likes</th>
                                <th className="text-right p-4 font-medium">Views</th>
                                <th className="text-center p-4 font-medium">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                                    <td className="p-4 max-w-[250px] truncate">{item.title}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">
                                            {item.category || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400">{item.affiliate_source || '-'}</td>
                                    <td className="p-4 text-right">{item.likes}</td>
                                    <td className="p-4 text-right">{item.views}</td>
                                    <td className="p-4 text-center">
                                        {item.is_premium && <span title="Premium">⭐</span>}
                                        {item.is_verified && <span title="Verificado">✓</span>}
                                        {item.image_url ? <span title="Tiene imagen">🖼️</span> : <span title="Sin imagen">❌</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Actions */}
            <section className="flex flex-wrap gap-4">
                <a
                    href="/admin/analytics"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    📊 Analytics Dashboard
                </a>
                <a
                    href="/admin/upload"
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    ⬆️ Subir Contenido
                </a>
                <button
                    onClick={handleExportCSV}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    📥 Exportar CSV
                </button>
                <a
                    href="/"
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    ← Volver al Feed
                </a>
            </section>
        </div>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    icon,
    color,
}: {
    title: string;
    value: number;
    subtitle?: string;
    icon: string;
    color: string;
}) {
    return (
        <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm opacity-80">{title}</p>
                    <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
                    {subtitle && <p className="text-sm opacity-80 mt-1">{subtitle}</p>}
                </div>
                <span className="text-3xl">{icon}</span>
            </div>
        </div>
    );
}

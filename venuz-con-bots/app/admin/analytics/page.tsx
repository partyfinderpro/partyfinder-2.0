'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';

const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

interface AnalyticsStats {
    total_views: number;
    total_searches: number;
    total_favorites: number;
    unique_users: number;
    top_content: Array<{ id: string; title: string; category: string; views: number }>;
    top_searches: Array<{ query: string; count: number }>;
    daily_activity: Array<{ date: string; count: number }>;
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                const res = await fetch(`/api/analytics?days=${days}`);
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [days]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    const metrics = [
        { label: 'Vistas Totales', value: stats?.total_views || 0, icon: '👁️' },
        { label: 'Búsquedas', value: stats?.total_searches || 0, icon: '🔍' },
        { label: 'Favoritos', value: stats?.total_favorites || 0, icon: '❤️' },
        { label: 'Usuarios Únicos', value: stats?.unique_users || 0, icon: '👥' },
    ];

    return (
        <div className="min-h-screen bg-black pb-20">
            <header className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-pink-200 hover:text-white mb-2 inline-block">← Volver</Link>
                        <h1 className="text-4xl font-bold text-white">📊 Analytics Dashboard</h1>
                        <p className="text-pink-100 mt-2">Últimos {days} días</p>
                    </div>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30"
                    >
                        <option value={7}>7 días</option>
                        <option value={30}>30 días</option>
                        <option value={90}>90 días</option>
                    </select>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((metric, index) => (
                        <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-900 rounded-2xl p-6 border border-pink-500/20"
                        >
                            <span className="text-4xl mb-4 block">{metric.icon}</span>
                            <p className="text-gray-400 text-sm mb-2">{metric.label}</p>
                            <p className="text-3xl font-bold text-white">{metric.value.toLocaleString()}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Activity Chart */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 rounded-2xl p-6 border border-pink-500/20">
                    <h2 className="text-2xl font-bold text-white mb-6">📈 Actividad Diaria</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.daily_activity?.reverse() || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} />
                                <YAxis stroke="#888" tick={{ fill: '#888' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ec4899', borderRadius: '8px', color: '#fff' }} />
                                <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={3} dot={{ fill: '#ec4899', r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-900 rounded-2xl p-6 border border-pink-500/20">
                        <h2 className="text-2xl font-bold text-white mb-6">🔥 Top Contenido</h2>
                        <div className="space-y-3">
                            {stats?.top_content?.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                                    <span className="text-2xl font-bold text-pink-500 w-8">#{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold truncate">{item.title}</p>
                                        <p className="text-gray-400 text-xs capitalize">{item.category}</p>
                                    </div>
                                    <span className="text-pink-400 font-bold">{item.views} views</span>
                                </div>
                            )) || <p className="text-gray-500">No hay datos</p>}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-900 rounded-2xl p-6 border border-pink-500/20">
                        <h2 className="text-2xl font-bold text-white mb-6">🔍 Búsquedas Populares</h2>
                        <div className="space-y-3">
                            {stats?.top_searches?.map((search, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                                    <span className="text-2xl font-bold text-blue-500 w-8">#{index + 1}</span>
                                    <div className="flex-1"><p className="text-white font-semibold">{search.query}</p></div>
                                    <span className="text-blue-400 font-bold">{search.count}x</span>
                                </div>
                            )) || <p className="text-gray-500">No hay datos</p>}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

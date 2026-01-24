'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    BarChart3, Eye, Heart, CheckCircle, Trash2, RefreshCw,
    Shield, TrendingUp, Users, FileText, Map as MapIcon,
    Activity
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';

interface ContentItem {
    id: string;
    title: string;
    category: string;
    is_verified: boolean;
    is_premium: boolean;
    views: number;
    likes: number;
    created_at: string;
    affiliate_source?: string;
}

interface Stats {
    totalContent: number;
    totalViews: number;
    totalLikes: number;
    byCategory: Record<string, number>;
    byAffiliate: Record<string, number>;
}

export default function AdminPage() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [content, setContent] = useState<ContentItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [geoStats, setGeoStats] = useState<any[]>([]);
    const [growthStats, setGrowthStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        async function checkAdmin() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setIsAdmin(false); setLoading(false); return; }

            let role = 'user';

            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                if (profile) role = profile.role;
            } catch (e) {
                console.log('Error checking profiles, trying users...');
            }

            if (role === 'admin' || session.user.email?.includes('admin')) {
                setIsAdmin(true);
                await Promise.all([loadContent(), loadStats(), loadAdvancedStats()]);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        }
        checkAdmin();
    }, []);

    async function loadContent() {
        const { data } = await supabase
            .from('content')
            .select('id, title, category, is_verified, is_premium, views, likes, created_at, affiliate_source')
            .order('created_at', { ascending: false })
            .limit(50);
        setContent(data || []);
    }

    async function loadStats() {
        const { data } = await supabase.from('content').select('category, views, likes, affiliate_source');
        if (!data) return;

        const stats: Stats = {
            totalContent: data.length,
            totalViews: data.reduce((sum, item) => sum + (item.views || 0), 0),
            totalLikes: data.reduce((sum, item) => sum + (item.likes || 0), 0),
            byCategory: {},
            byAffiliate: {},
        };

        data.forEach(item => {
            stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
            if (item.affiliate_source) stats.byAffiliate[item.affiliate_source] = (stats.byAffiliate[item.affiliate_source] || 0) + 1;
        });
        setStats(stats);
    }

    async function loadAdvancedStats() {
        // Estas funciones RPC deben estar creadas en Supabase (scripts/phase2-setup.sql)
        const { data: cities } = await supabase.rpc('get_user_cities_count');
        const { data: growth } = await supabase.rpc('get_user_growth_by_month');

        if (cities) setGeoStats(cities);
        if (growth) setGrowthStats(growth);
    }

    // Render Logic
    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
    );

    if (!isAdmin) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
            <div className="bg-white/5 backdrop-blur-3xl border border-red-500/20 p-12 rounded-[40px]">
                <Shield className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold mb-2">Acceso Reservado</h1>
                <p className="text-white/40 mb-8">Debes tener rol de administrador para gestionar VENUZ.</p>
                <a href="/" className="px-8 py-3 bg-white text-black font-bold rounded-full">Volver al Inicio</a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                            COMMAND CENTER
                        </h1>
                        <p className="text-white/40">Gestión de contenido e inteligencia de mercado</p>
                    </div>
                    <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10">
                        <RefreshCw className="w-4 h-4" /> Refrescar Datos
                    </button>
                </div>

                {/* Top Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Contenido', val: stats?.totalContent, icon: FileText, color: 'text-blue-400' },
                        { label: 'Vistas Totales', val: stats?.totalViews.toLocaleString(), icon: Eye, color: 'text-green-400' },
                        { label: 'Likes Totales', val: stats?.totalLikes.toLocaleString(), icon: Heart, color: 'text-pink-400' },
                        { label: 'Ciudades Activas', val: geoStats.length, icon: MapIcon, color: 'text-amber-400' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-xl">
                            <s.icon className={`w-6 h-6 ${s.color} mb-4`} />
                            <p className="text-white/40 text-sm mb-1">{s.label}</p>
                            <p className="text-2xl font-bold">{s.val}</p>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Gráfica de Ciudades */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <MapIcon className="w-5 h-5 text-pink-500" /> Distribución por Ciudad
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={geoStats}>
                                    <XAxis dataKey="city" stroke="#ffffff40" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff20', borderRadius: '16px' }}
                                        itemStyle={{ color: '#ec4899' }}
                                    />
                                    <Bar dataKey="count" fill="#ec4899" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Gráfica de Crecimiento */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-500" /> Crecimiento de Usuarios
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthStats}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                                    <XAxis dataKey="month" stroke="#ffffff40" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff20', borderRadius: '16px' }}
                                    />
                                    <Area type="monotone" dataKey="new_users" stroke="#a855f7" fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Table List */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden">
                    <div className="p-8 border-b border-white/10 text-xl font-bold">Gestión de Contenido</div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-8 py-4 text-left text-sm text-white/40">Título</th>
                                    <th className="px-8 py-4 text-left text-sm text-white/40">Categoría</th>
                                    <th className="px-8 py-4 text-center text-sm text-white/40">Popularidad</th>
                                    <th className="px-8 py-4 text-center text-sm text-white/40">Status</th>
                                    <th className="px-8 py-4 text-right text-sm text-white/40">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {content.map(item => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-8 py-6 font-medium">{item.title}</td>
                                        <td className="px-8 py-6 opacity-60 capitalize">{item.category}</td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex items-center justify-center gap-4 text-sm">
                                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.views}</span>
                                                <span className="flex items-center gap-1 text-pink-500"><Heart className="w-3 h-3 fill-pink-500" /> {item.likes}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center gap-2">
                                                {item.is_verified && <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Verificado</span>}
                                                {item.is_premium && <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">Premium</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button onClick={() => alert('Próximamente editar')} className="p-2 text-white/40 hover:text-white transition-colors mr-2">✏️</button>
                                            <button className="p-2 text-red-500/40 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

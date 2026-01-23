// app/admin/page.tsx
// Panel de Admin Básico protegido por rol
// Código basado en análisis de Grok

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    BarChart3,
    Eye,
    Heart,
    CheckCircle,
    XCircle,
    Trash2,
    RefreshCw,
    Shield,
    TrendingUp,
    Users,
    FileText
} from 'lucide-react';

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
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Verificar si es admin
    useEffect(() => {
        async function checkAdmin() {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (profile?.role === 'admin') {
                setIsAdmin(true);
                await loadContent();
                await loadStats();
            } else {
                setIsAdmin(false);
            }

            setLoading(false);
        }

        checkAdmin();
    }, []);

    // Cargar contenido
    async function loadContent() {
        const { data } = await supabase
            .from('content')
            .select('id, title, category, is_verified, is_premium, views, likes, created_at, affiliate_source')
            .order('created_at', { ascending: false })
            .limit(100);

        setContent(data || []);
    }

    // Cargar estadísticas
    async function loadStats() {
        const { data } = await supabase
            .from('content')
            .select('category, views, likes, affiliate_source');

        if (!data) return;

        const stats: Stats = {
            totalContent: data.length,
            totalViews: data.reduce((sum, item) => sum + (item.views || 0), 0),
            totalLikes: data.reduce((sum, item) => sum + (item.likes || 0), 0),
            byCategory: {},
            byAffiliate: {},
        };

        data.forEach(item => {
            const cat = item.category || 'sin_categoria';
            stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

            if (item.affiliate_source) {
                stats.byAffiliate[item.affiliate_source] = (stats.byAffiliate[item.affiliate_source] || 0) + 1;
            }
        });

        setStats(stats);
    }

    // Toggle verificado
    async function toggleVerified(id: string, currentValue: boolean) {
        setActionLoading(id);

        await supabase
            .from('content')
            .update({ is_verified: !currentValue })
            .eq('id', id);

        setContent(prev => prev.map(item =>
            item.id === id ? { ...item, is_verified: !currentValue } : item
        ));

        setActionLoading(null);
    }

    // Toggle premium
    async function togglePremium(id: string, currentValue: boolean) {
        setActionLoading(id);

        await supabase
            .from('content')
            .update({ is_premium: !currentValue })
            .eq('id', id);

        setContent(prev => prev.map(item =>
            item.id === id ? { ...item, is_premium: !currentValue } : item
        ));

        setActionLoading(null);
    }

    // Eliminar contenido
    async function deleteContent(id: string) {
        if (!confirm('¿Eliminar este contenido permanentemente?')) return;

        setActionLoading(id);

        await supabase
            .from('content')
            .delete()
            .eq('id', id);

        setContent(prev => prev.filter(item => item.id !== id));
        setActionLoading(null);
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
        );
    }

    // No autorizado
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <div className="text-center p-8 bg-black/50 rounded-3xl border border-red-500/50">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h1>
                    <p className="text-white/50">Necesitas ser administrador para ver esta página.</p>
                    <a href="/" className="mt-4 inline-block px-6 py-2 bg-pink-500 text-white rounded-full">
                        Volver al inicio
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">🛡️ Panel de Administración</h1>
                        <p className="text-white/50">VENUZ Content Management</p>
                    </div>
                    <button
                        onClick={() => { loadContent(); loadStats(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                            <div className="flex items-center gap-3">
                                <FileText className="w-8 h-8 text-blue-400" />
                                <div>
                                    <p className="text-white/50 text-sm">Total Contenido</p>
                                    <p className="text-2xl font-bold text-white">{stats.totalContent}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                            <div className="flex items-center gap-3">
                                <Eye className="w-8 h-8 text-green-400" />
                                <div>
                                    <p className="text-white/50 text-sm">Total Views</p>
                                    <p className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                            <div className="flex items-center gap-3">
                                <Heart className="w-8 h-8 text-pink-400" />
                                <div>
                                    <p className="text-white/50 text-sm">Total Likes</p>
                                    <p className="text-2xl font-bold text-white">{stats.totalLikes.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-8 h-8 text-yellow-400" />
                                <div>
                                    <p className="text-white/50 text-sm">Afiliados</p>
                                    <p className="text-2xl font-bold text-white">{Object.keys(stats.byAffiliate).length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categorías */}
                {stats && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-8">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Por Categoría
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                                <div key={cat} className="bg-black/30 rounded-xl p-3 text-center">
                                    <p className="text-white/50 text-xs capitalize">{cat}</p>
                                    <p className="text-xl font-bold text-white">{count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabla de contenido */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white">Contenido Reciente ({content.length})</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm text-white/70">Título</th>
                                    <th className="px-4 py-3 text-left text-sm text-white/70">Categoría</th>
                                    <th className="px-4 py-3 text-center text-sm text-white/70">Views</th>
                                    <th className="px-4 py-3 text-center text-sm text-white/70">Likes</th>
                                    <th className="px-4 py-3 text-center text-sm text-white/70">Verificado</th>
                                    <th className="px-4 py-3 text-center text-sm text-white/70">Premium</th>
                                    <th className="px-4 py-3 text-center text-sm text-white/70">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {content.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="text-white truncate block max-w-xs" title={item.title}>
                                                {item.title}
                                            </span>
                                            {item.affiliate_source && (
                                                <span className="text-xs text-pink-400">🔗 {item.affiliate_source}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-white/70 capitalize">{item.category}</td>
                                        <td className="px-4 py-3 text-center text-white/70">{item.views || 0}</td>
                                        <td className="px-4 py-3 text-center text-white/70">{item.likes || 0}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => toggleVerified(item.id, item.is_verified)}
                                                disabled={actionLoading === item.id}
                                                className={`p-2 rounded-lg transition-colors ${item.is_verified
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-white/10 text-white/30'
                                                    }`}
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => togglePremium(item.id, item.is_premium)}
                                                disabled={actionLoading === item.id}
                                                className={`p-2 rounded-lg transition-colors ${item.is_premium
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-white/10 text-white/30'
                                                    }`}
                                            >
                                                ⭐
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => deleteContent(item.id)}
                                                disabled={actionLoading === item.id}
                                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                            >
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

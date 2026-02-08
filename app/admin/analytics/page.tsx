'use client';

import { useState, useEffect } from 'react';
import {
    BarChart3,
    Users,
    Heart,
    ExternalLink,
    TrendingUp,
    RefreshCw,
    Loader2,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface ABStats {
    control: { assignments: number; likes: number; conversions: number };
    A: { assignments: number; likes: number; conversions: number };
    B: { assignments: number; likes: number; conversions: number };
    C: { assignments: number; likes: number; conversions: number };
}

interface ConversionStats {
    totalConversions: number;
    bySource: Record<string, { clicks: number; signups: number; purchases: number }>;
    byDay: Record<string, number>;
}

export default function AdminAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [abStats, setAbStats] = useState<ABStats | null>(null);
    const [conversionStats, setConversionStats] = useState<ConversionStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch A/B stats
            const abRes = await fetch('/api/analytics/ab');
            const abData = await abRes.json();

            if (abData.error && abData.message?.includes('SQL migration')) {
                setError('⚠️ FALTAN TABLAS EN SUPABASE: Ejecuta el archivo supabase/migrations/20260207_interactions_rpc.sql');
                return;
            }

            if (abData.stats) {
                setAbStats(abData.stats);
            }

            // Fetch conversion stats
            const convRes = await fetch('/api/analytics/conversions');
            const convData = await convRes.json();
            if (convData.bySource) {
                setConversionStats(convData);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const variants = ['control', 'A', 'B', 'C'] as const;
    const variantColors = {
        control: 'bg-gray-600',
        A: 'bg-blue-600',
        B: 'bg-green-600',
        C: 'bg-purple-600',
    };

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-white/10 rounded-lg transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <BarChart3 className="w-8 h-8 text-pink-500" />
                                Analytics Dashboard
                            </h1>
                            <p className="text-gray-400 mt-1">A/B Testing & Conversiones</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        Actualizar
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                        {error}
                    </div>
                )}

                {/* A/B Testing Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        A/B Testing - Variantes
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {variants.map(variant => {
                            const data = abStats?.[variant] || { assignments: 0, likes: 0, conversions: 0 };
                            const conversionRate = data.assignments > 0
                                ? ((data.conversions / data.assignments) * 100).toFixed(1)
                                : '0.0';
                            const engagementRate = data.assignments > 0
                                ? ((data.likes / data.assignments) * 100).toFixed(1)
                                : '0.0';

                            return (
                                <div
                                    key={variant}
                                    className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-white/10"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${variantColors[variant]} text-white`}>
                                            {variant === 'control' ? 'Control' : `Variante ${variant}`}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm flex items-center gap-1">
                                                <Users className="w-3 h-3" /> Usuarios
                                            </span>
                                            <span className="font-bold">{data.assignments.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm flex items-center gap-1">
                                                <Heart className="w-3 h-3" /> Likes
                                            </span>
                                            <span className="font-bold">{data.likes.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3" /> Conversiones
                                            </span>
                                            <span className="font-bold">{data.conversions.toLocaleString()}</span>
                                        </div>
                                        <div className="pt-3 border-t border-white/10">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Conv. Rate</span>
                                                <span className="text-green-400 font-bold">{conversionRate}%</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm mt-1">
                                                <span className="text-gray-500">Engagement</span>
                                                <span className="text-pink-400 font-bold">{engagementRate}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Conversions Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ExternalLink className="w-5 h-5 text-green-400" />
                        Conversiones por Fuente (7 días)
                    </h2>

                    {conversionStats?.bySource && Object.keys(conversionStats.bySource).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(conversionStats.bySource).map(([source, data]) => (
                                <div
                                    key={source}
                                    className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-white/10"
                                >
                                    <h3 className="font-bold text-lg mb-3 capitalize">{source}</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Clicks</span>
                                            <span className="font-bold text-blue-400">{data.clicks}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Signups</span>
                                            <span className="font-bold text-green-400">{data.signups}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Purchases</span>
                                            <span className="font-bold text-amber-400">{data.purchases}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-900/50 rounded-2xl p-8 text-center text-gray-500">
                            <p>No hay datos de conversiones todavía.</p>
                            <p className="text-sm mt-2">Los clicks en afiliados se trackearán automáticamente.</p>
                        </div>
                    )}
                </section>

                {/* Daily Chart */}
                {conversionStats?.byDay && Object.keys(conversionStats.byDay).length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                            Conversiones por Día
                        </h2>

                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-white/10">
                            <div className="flex items-end gap-2 h-48">
                                {Object.entries(conversionStats.byDay)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .slice(-7)
                                    .map(([date, count]) => {
                                        const maxCount = Math.max(...Object.values(conversionStats.byDay));
                                        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                        return (
                                            <div key={date} className="flex-1 flex flex-col items-center gap-2">
                                                <div
                                                    className="w-full bg-gradient-to-t from-pink-600 to-purple-600 rounded-t-lg transition-all"
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                />
                                                <span className="text-xs text-gray-500">{date.slice(5)}</span>
                                                <span className="text-xs font-bold">{count}</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </section>
                )}

                {/* Info Box */}
                <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-blue-300 text-sm">
                        💡 <strong>Nota:</strong> Para que estos datos se llenen, ejecuta las migraciones SQL en Supabase.
                        Los eventos se trackean automáticamente cuando los usuarios interactúan con la app.
                    </p>
                </div>
            </div>
        </div>
    );
}

// app/admin/analytics/page.tsx
import React from 'react';
import { supabase } from '@/lib/supabase';
import {
    BarChart,
    TrendingUp,
    Users,
    DollarSign,
    MousePointer2,
    Share2,
    LayoutDashboard,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsDashboard() {
    // Fetch some real stats
    const { data: experiments } = await supabase.from('highway_experiments').select('*');
    const { data: affiliateLinks } = await supabase.from('affiliate_links').select('click_count, revenue_estimated').limit(100);

    // Static summary for POC
    const summary = [
        { title: 'Total Revenue', value: '$12,450', change: '+12.5%', icon: DollarSign, color: 'text-green-500' },
        { title: 'Active Users', value: '8,920', change: '+5.2%', icon: Users, color: 'text-blue-500' },
        { title: 'Affiliate Clicks', value: '45,210', change: '+24.1%', icon: MousePointer2, color: 'text-purple-500' },
        { title: 'Telegram Subs', value: '1,204', change: '+18.7%', icon: Share2, color: 'text-pink-500' },
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black flex items-center gap-3 tracking-tighter">
                            <LayoutDashboard className="w-10 h-10 text-pink-500" />
                            ANALYTICS <span className="text-white/20">DASHBOARD</span>
                        </h1>
                        <p className="text-white/40 mt-2 font-medium">Monitoring growth, monetization and highway experiments</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 font-bold transition-all">
                            EXPORT DATA
                        </button>
                        <button className="px-6 py-3 bg-pink-600 hover:bg-pink-500 rounded-2xl font-bold shadow-lg shadow-pink-600/20 transition-all">
                            REFRESH
                        </button>
                    </div>
                </div>

                {/* Global Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {summary.map((stat, i) => (
                        <div key={i} className="p-8 bg-neutral-900/50 rounded-[32px] border border-white/5 hover:border-white/10 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl bg-neutral-800 ${stat.color} group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-bold ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                    {stat.change}
                                    {stat.change.startsWith('+') ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                </div>
                            </div>
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs mb-2">{stat.title}</p>
                            <h3 className="text-3xl font-black tracking-tight">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Experiments & Conversion Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Active Experiments */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-blue-500" />
                            HIGHWAY EXPERIMENTS
                        </h2>
                        <div className="overflow-hidden rounded-[32px] border border-white/5 bg-neutral-900/30">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/5">
                                    <tr>
                                        <th className="p-6 font-bold text-white/40">Experiment Name</th>
                                        <th className="p-6 font-bold text-white/40 text-center">Split</th>
                                        <th className="p-6 font-bold text-white/40 text-center">Winner</th>
                                        <th className="p-6 font-bold text-white/40 text-right">Lift</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {(experiments && experiments.length > 0) ? experiments.map((exp, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-6">
                                                <p className="font-bold text-lg">{exp.name}</p>
                                                <p className="text-white/30 text-sm mt-1">{exp.description}</p>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="inline-flex rounded-full overflow-hidden w-24 h-1.5 bg-white/10">
                                                    <div className="bg-blue-500" style={{ width: '50%' }} />
                                                    <div className="bg-pink-500" style={{ width: '50%' }} />
                                                </div>
                                                <p className="text-xs text-white/20 mt-2 font-bold uppercase tracking-tighter">50/50 Traffic</p>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-black tracking-widest">VARIANCE B</span>
                                            </td>
                                            <td className="p-6 text-right font-black text-green-400 text-xl">+8.4%</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center text-white/20 font-bold italic">No active experiments found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top Affiliate Sources */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <MousePointer2 className="w-6 h-6 text-purple-500" />
                            TOP CONVERSION
                        </h2>
                        <div className="space-y-4">
                            {[
                                { name: 'Camsoda', clicks: '2.4k', conversion: '12.4%', color: 'bg-orange-500' },
                                { name: 'Stripchat', clicks: '1.8k', conversion: '10.2%', color: 'bg-pink-500' },
                                { name: 'Chaturbate', clicks: '1.5k', conversion: '9.8%', color: 'bg-green-500' },
                                { name: 'La Santa VIP', clicks: '0.9k', conversion: '15.1%', color: 'bg-purple-500' },
                            ].map((source, i) => (
                                <div key={i} className="p-6 bg-neutral-900 border border-white/5 rounded-3xl flex justify-between items-center group hover:bg-neutral-800 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${source.color} shadow-[0_0_10px_currentColor]`} />
                                        <div>
                                            <p className="font-black text-lg">{source.name}</p>
                                            <p className="text-white/40 text-xs font-bold">{source.clicks} Clicks</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-green-400 font-black text-xl">{source.conversion}</p>
                                        <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">CR Ratio</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart Mockup Area */}
                <div className="p-12 bg-neutral-900 rounded-[48px] border border-white/5 space-y-8">
                    <h2 className="text-3xl font-black flex items-center gap-3">
                        <BarChart className="w-8 h-8 text-blue-500" />
                        REVENUE TRENDS
                    </h2>
                    <div className="relative h-64 w-full flex items-end gap-2 px-4">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-blue-600 to-pink-500 hover:scale-x-110 transition-transform cursor-pointer rounded-t-lg opacity-80"
                                style={{ height: `${Math.random() * 80 + 20}%` }}
                            />
                        ))}
                        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-white/10" />
                    </div>
                    <div className="flex justify-between text-white/20 text-xs font-black uppercase tracking-widest px-4">
                        <span>Feb 01</span>
                        <span>Feb 08</span>
                        <span>Feb 15</span>
                        <span>Feb 22</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Flame, ShieldCheck } from 'lucide-react';

/**
 * Widget que simula/calcula usuarios en vivo
 */
export function LiveNowCounter() {
    const [count, setCount] = useState(842);

    useEffect(() => {
        const interval = setInterval(() => {
            const delta = Math.floor(Math.random() * 5) - 2;
            setCount(prev => prev + delta);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center space-x-2 text-xs font-medium px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full animate-pulse">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>LIVE NOW: {count.toLocaleString()} online</span>
        </div>
    );
}

/**
 * Badge de Verificación Premium
 */
export function VerifiedBadge({ type = 'premium' }: { type?: 'premium' | 'agency' }) {
    return (
        <div className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
            <ShieldCheck size={10} />
            <span>{type === 'premium' ? 'Verified' : 'Agency Partner'}</span>
        </div>
    );
}

/**
 * Sidebar de contenido Trending
 */
export function TrendingSidebar({ items }: { items: any[] }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2 text-venuz-pink mb-4">
                <Flame size={20} />
                <h3 className="font-bold uppercase tracking-widest text-sm">Trending Now</h3>
            </div>

            <div className="space-y-3">
                {items.slice(0, 5).map((item, idx) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group flex items-center space-x-3 cursor-pointer p-2 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all"
                    >
                        <div className="text-xl font-black text-white/20 group-hover:text-venuz-pink/50 transition-colors">
                            {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate text-gray-200">{item.title}</div>
                            <div className="text-[10px] text-gray-500 uppercase">{item.pillar}</div>
                        </div>
                        <div className="text-[10px] font-mono text-venuz-pink">
                            {(Math.random() * 10 + 90).toFixed(1)}%
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

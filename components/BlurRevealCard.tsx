'use client';

import { useState } from 'react';
import Image from 'next/image';

interface BlurRevealProps {
    imageUrl?: string;
    title: string;
    description: string;
    affiliateUrl?: string; // Changed to optional to match typical props
    vibe?: string[];
    visualStyle?: {
        className: string;
        neonColor: string;
        cssFilter: string;
    }
}

export default function BlurRevealCard(props: BlurRevealProps) {
    const { imageUrl, title, description, affiliateUrl, vibe, visualStyle } = props;
    const [revealed, setRevealed] = useState(false);

    // Default fallback image if none provided
    const src = imageUrl || 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67';

    return (
        <div
            className="relative overflow-hidden rounded-2xl group cursor-pointer transition-transform transform hover:scale-[1.01]"
            onClick={() => setRevealed(!revealed)}
            style={{
                border: revealed && visualStyle ? `1px solid ${visualStyle.neonColor}` : '1px solid transparent',
                boxShadow: revealed && visualStyle ? `0 0 15px ${visualStyle.neonColor}40` : 'none'
            }}
        >
            <div className="relative w-full h-80">
                <Image
                    src={src}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`object-cover transition-all duration-700 ease-in-out ${revealed ? '' : 'blur-xl scale-110'}`}
                    style={{
                        filter: revealed && visualStyle ? visualStyle.cssFilter : 'brightness(0.5) blur(12px)'
                    }}
                />
            </div>

            {/* Overlay Oscuro para Texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

            {/* Contenido Texto */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10 pointer-events-none">
                <h3 className="text-white text-xl font-bold drop-shadow-md mb-1">{title}</h3>
                <p className="text-zinc-300 text-sm line-clamp-2 mb-4 drop-shadow-sm leading-snug">{description}</p>

                {/* Botón CTA (Solo visible/clickable si revealed o affiliateUrl directo) */}
                {affiliateUrl && (
                    <div className="mt-2 pointer-events-auto">
                        <a
                            href={affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center bg-white text-black px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wide hover:bg-zinc-200 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Ver detalles →
                        </a>
                    </div>
                )}

                {/* Vibe Tags Visuals */}
                {vibe && vibe.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {vibe.map(v => (
                            <span key={v} className="text-[10px] uppercase font-bold tracking-wider text-white/60 bg-white/10 px-2 py-1 rounded backdrop-blur-md">
                                {v.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Tap to Reveal Hint (Solo si no revealed) */}
            {!revealed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                    <span className="text-white text-xs uppercase tracking-widest border border-white/30 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm">
                        Tap to Reveal
                    </span>
                </div>
            )}
        </div>
    );
}

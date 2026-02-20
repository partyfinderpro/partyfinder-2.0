'use client';

import { useState } from 'react';
import Image from 'next/image';

interface BlurRevealCardProps {
    /** URL de la imagen del contenido adulto */
    imageUrl: string;
    /** Título del item */
    title: string;
    /** Si es true, el contenido ya es visible (Night Mode activo) */
    nightModeActive?: boolean;
    /** URL de destino al hacer click */
    href?: string;
    /** Color neon del card (del visual enhancer) */
    neonColor?: string;
    /** Clase CSS adicional */
    className?: string;
    /** Callback cuando el usuario hace click (luego del reveal) */
    onReveal?: () => void;
    children?: React.ReactNode;
}

/**
 * BlurRevealCard - Smart Cloaking para contenido adulto en el feed público.
 *
 * Concepto: en el feed principal las imágenes adultas aparecen con un
 * frosted-glass blur elegante. Al hacer hover (desktop) o tap (mobile)
 * se revela el contenido — registrando que el usuario eligió verlo
 * voluntariamente (consent by action).
 *
 * Si nightModeActive = true (hora > 20h o usuario en "modo noche"), 
 * se muestra directamente sin blur.
 */
export default function BlurRevealCard({
    imageUrl,
    title,
    nightModeActive = false,
    href,
    neonColor = '#a855f7',
    className = '',
    onReveal,
    children,
}: BlurRevealCardProps) {
    const [revealed, setRevealed] = useState(nightModeActive);

    const handleReveal = () => {
        if (!revealed) {
            setRevealed(true);
            onReveal?.();
        }
    };

    const neonBoxShadow = `0 0 12px ${neonColor}55, 0 0 24px ${neonColor}33, inset 0 0 8px ${neonColor}22`;

    return (
        <div
            className={`relative overflow-hidden rounded-2xl cursor-pointer group ${className}`}
            style={{ boxShadow: neonBoxShadow }}
            onClick={handleReveal}
        >
            {/* Imagen de fondo */}
            <div className="relative w-full aspect-[4/5]">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover transition-all duration-700"
                    style={{
                        filter: revealed
                            ? 'none'
                            : 'blur(18px) brightness(0.7) saturate(0.6)',
                    }}
                    unoptimized // Imágenes externas — desactivar optimización
                />

                {/* Overlay gradient siempre presente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Badge neon de categoría */}
                <div
                    className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    style={{
                        borderColor: `${neonColor}66`,
                        color: neonColor,
                        background: `${neonColor}18`,
                        boxShadow: `0 0 6px ${neonColor}44`,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    18+
                </div>

                {/* --- ESTADO: NO REVELADO --- */}
                {!revealed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-300">
                        {/* Icono con neon */}
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border transition-transform duration-300 group-hover:scale-110"
                            style={{
                                borderColor: `${neonColor}66`,
                                background: `${neonColor}22`,
                                boxShadow: `0 0 16px ${neonColor}55`,
                            }}
                        >
                            ✦
                        </div>
                        <p
                            className="text-xs font-semibold uppercase tracking-widest text-center px-4"
                            style={{ color: neonColor, textShadow: `0 0 8px ${neonColor}` }}
                        >
                            Toca para revelar
                        </p>
                        {/* Título visible incluso en blur */}
                        <p className="text-white/80 text-sm font-medium text-center px-4 line-clamp-2">
                            {title}
                        </p>
                    </div>
                )}

                {/* --- ESTADO: REVELADO --- */}
                {revealed && (
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white font-semibold text-sm line-clamp-1">{title}</p>
                        {children && (
                            <div className="mt-1">{children}</div>
                        )}
                        {href && (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block mt-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 hover:scale-105"
                                style={{
                                    background: `linear-gradient(135deg, ${neonColor}, ${neonColor}88)`,
                                    boxShadow: `0 0 10px ${neonColor}55`,
                                    color: '#fff',
                                }}
                            >
                                Ver más →
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

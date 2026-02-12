"use client";

import { ReactNode } from 'react';
import DynamicCasinoBackground from './DynamicCasinoBackground';

interface CasinoThemeWrapperProps {
    children: ReactNode;
}

export default function CasinoThemeWrapper({ children }: CasinoThemeWrapperProps) {
    return (
        <>
            {/* Fondo casino inmersivo detrás de todo */}
            <DynamicCasinoBackground />

            {/* Contenido original con z-index para quedar encima */}
            <div className="relative z-10 min-h-screen bg-black/30 backdrop-blur-[2px]">
                {children}
            </div>
        </>
    );
}

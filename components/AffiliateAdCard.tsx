'use client';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface AffiliateAdCardProps {
    id: string;
    platform: 'crakrevenue' | 'hotmart' | 'clickbank' | 'other';
    display_name: string;
    display_image: string;
    cta_text: string;
    url: string; // URL tracking interna (/api/go?id=...)
}

export default function AffiliateAdCard({
    id,
    platform,
    display_name,
    display_image,
    cta_text,
    url,
}: AffiliateAdCardProps) {

    const handleClick = () => {
        // Analytics opcional local: console.log('Ad click:', id);
        window.location.href = `/api/go?id=${id}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative w-full aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer border border-yellow-500/20"
            onClick={handleClick}
        >
            {/* Etiqueta Publicidad */}
            <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-white/10">
                Promotores
            </div>

            {/* Imagen de fondo / Banner */}
            <div className="absolute inset-0 w-full h-full">
                <Image
                    src={display_image}
                    alt={display_name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Overlay gradiente para legibilidad */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
            </div>

            {/* Contenido Inferior */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col items-center text-center gap-3">

                <h3 className="text-xl font-bold text-white drop-shadow-md line-clamp-2">
                    {display_name}
                </h3>

                <p className="text-sm text-gray-200 line-clamp-2 opacity-90">
                    Descubre más oportunidades exclusivas para ti.
                </p>

                {/* Botón CTA */}
                <button
                    className="mt-2 w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-yellow-500/30 active:scale-95"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                >
                    <span>{cta_text}</span>
                    <ExternalLink className="w-4 h-4" />
                </button>
            </div>

            {/* Efecto brillo al hover */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.div>
    );
}

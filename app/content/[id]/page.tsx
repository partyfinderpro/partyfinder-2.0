// app/content/[id]/page.tsx
// Página de detalle individual para SEO
// Código de Grok

import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { MapPin, Heart, Eye, Share2, ShieldCheck, ChevronLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Helper para sanitizar URLs de imágenes problemáticas
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&q=80';
const sanitizeImageUrl = (url: string | null | undefined): string => {
    if (!url) return DEFAULT_IMAGE;
    if (url.includes('googleapis.com') || url.includes('googleusercontent.com') || url.includes('google.com/maps')) {
        return DEFAULT_IMAGE;
    }
    return url;
};

export async function generateMetadata({ params }: { params: { id: string } }) {
    const { data } = await supabase.from('content').select('title,description,image_url').eq('id', params.id).single();

    return {
        title: `${data?.title || 'Contenido'} | VENUZ`,
        description: data?.description || 'Descubre lo mejor de VENUZ',
        openGraph: {
            images: [data?.image_url || '/og-image.png'],
        },
    };
}

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
    const { data: content, error } = await supabase
        .from('content')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error || !content) notFound();

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Background Blur Decor */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Back Button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-12 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" /> Volver al Explorador
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Media Section */}
                    <div className="space-y-6">
                        <div className="relative aspect-[4/5] md:aspect-square rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
                            {content.video_url ? (
                                <video
                                    src={content.video_url}
                                    controls
                                    className="w-full h-full object-cover"
                                    poster={sanitizeImageUrl(content.image_url)}
                                />
                            ) : (
                                <img
                                    src={sanitizeImageUrl(content.image_url)}
                                    alt={content.title}
                                    className="w-full h-full object-cover"
                                />
                            )}

                            {content.is_verified && (
                                <div className="absolute top-6 left-6 px-4 py-2 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-full flex items-center gap-2 text-green-400 font-bold text-sm">
                                    <ShieldCheck className="w-4 h-4" /> VERIFICADO
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex flex-col justify-center space-y-8">
                        <div>
                            <div className="flex items-center gap-4 text-pink-500 font-bold text-sm mb-4 tracking-widest uppercase">
                                <span>{content.category}</span>
                                <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                                <span className="flex items-center gap-1 text-white/50">
                                    <MapPin className="w-4 h-4" /> {content.location}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                                {content.title}
                            </h1>
                            <p className="text-xl text-white/60 leading-relaxed mb-8">
                                {content.description || 'Sin descripción disponible para este contenido.'}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-12 py-8 border-y border-white/10">
                            <div>
                                <p className="text-white/40 text-sm mb-1 uppercase tracking-tighter">Popularidad</p>
                                <div className="flex items-center gap-2 text-2xl font-bold">
                                    <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                                    {content.likes || 0}
                                </div>
                            </div>
                            <div>
                                <p className="text-white/40 text-sm mb-1 uppercase tracking-tighter">Impacto</p>
                                <div className="flex items-center gap-2 text-2xl font-bold">
                                    <Eye className="w-6 h-6 text-white/50" />
                                    {content.views || 0}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            {(content.source_url || content.affiliate_url) ? (
                                <a
                                    href={content.affiliate_url || content.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl text-white font-bold text-center flex items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(236,72,153,0.4)] transition-all"
                                >
                                    VISITAR SITIO
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                            ) : (
                                <div className="flex-1 py-5 bg-gray-800/50 rounded-3xl text-white/50 font-bold text-center flex items-center justify-center gap-3 cursor-not-allowed">
                                    Sin enlace disponible
                                </div>
                            )}
                            <button
                                className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-colors"
                                title="Guardar"
                            >
                                <Heart className="w-6 h-6" />
                            </button>
                            <button
                                className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-colors"
                                title="Compartir"
                            >
                                <Share2 className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Source Info */}
                        {content.source_site && (
                            <div className="flex items-center gap-3 text-white/40 text-sm">
                                <span>Fuente:</span>
                                <span className="px-3 py-1 bg-white/10 rounded-full font-medium text-white/60">
                                    {content.source_site.toUpperCase()}
                                </span>
                                {content.source_url && (
                                    <a
                                        href={content.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-pink-400 hover:text-pink-300 underline"
                                    >
                                        Ver original
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

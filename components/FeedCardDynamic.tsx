// components/FeedCardDynamic.tsx
'use client';
import DynamicPreview from './DynamicPreview';

interface ContentItem {
    id: string;
    title: string;
    description?: string;
    category?: string;

    // URLs de media
    image_url?: string;
    thumbnail_url?: string;
    preview_video_url?: string;
    preview_type?: 'video' | 'gif' | 'iframe' | 'image' | 'embed';
    iframe_preview_url?: string;
    embed_code?: string;
    gallery_urls?: string[];

    // Afiliados
    official_website?: string;
    affiliate_url?: string;
    has_affiliate?: boolean;

    // Calidad
    content_tier?: 'premium' | 'verified' | 'scraped';
    quality_score?: number;
}

interface FeedCardDynamicProps {
    item: ContentItem;
    className?: string;
}

export default function FeedCardDynamic({ item, className = '' }: FeedCardDynamicProps) {
    const previewType = item.preview_type || 'image';

    return (
        <div className={`relative w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl group ${className}`}>
            {/* Preview dinámico */}
            <DynamicPreview
                type={previewType}
                videoUrl={item.preview_video_url}
                iframeUrl={item.iframe_preview_url}
                imageUrl={item.image_url || item.thumbnail_url}
                embedCode={item.embed_code}
                posterUrl={item.thumbnail_url}
                affiliateUrl={item.affiliate_url}
                officialWebsite={item.official_website}
                hasAffiliate={item.has_affiliate}
                contentId={item.id}
                className="absolute inset-0"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

            {/* Contenido inferior */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 pointer-events-none">
                {/* Categoría */}
                {item.category && (
                    <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                        {item.category}
                    </span>
                )}

                {/* Título */}
                <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
                    {item.title}
                </h3>

                {/* Descripción */}
                {item.description && (
                    <p className="text-white/70 text-sm line-clamp-2">
                        {item.description}
                    </p>
                )}

                {/* Tier indicator */}
                {item.content_tier === 'premium' && (
                    <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium">
                        <span>⭐</span>
                        <span>Contenido Verificado</span>
                    </div>
                )}

                {item.content_tier === 'verified' && (
                    <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                        <span>✓</span>
                        <span>Verificado</span>
                    </div>
                )}
            </div>

            {/* Hover overlay con CTA */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    Ver más →
                </div>
            </div>
        </div>
    );
}

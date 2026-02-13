// components/DynamicPreview.tsx
'use client';
import { useState, useRef, useEffect } from 'react';

type PreviewType = 'video' | 'gif' | 'iframe' | 'image' | 'embed';

interface DynamicPreviewProps {
    type: PreviewType;
    videoUrl?: string;
    iframeUrl?: string;
    imageUrl?: string;
    embedCode?: string;
    posterUrl?: string;
    affiliateUrl?: string;
    officialWebsite?: string;
    hasAffiliate?: boolean;
    contentId?: string;
    isActive?: boolean;
    className?: string;
}

export default function DynamicPreview({
    type,
    videoUrl,
    iframeUrl,
    imageUrl,
    embedCode,
    posterUrl,
    affiliateUrl,
    officialWebsite,
    hasAffiliate,
    contentId,
    isActive,
    className = '',
}: DynamicPreviewProps) {
    const [muted, setMuted] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Detectar mobile
    useEffect(() => {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }, []);

    // Intersection Observer para lazy loading del src + autoplay + tracking
    useEffect(() => {
        const video = videoRef.current;
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Lazy loading del src: solo cargar cuando está cerca/visible
                    if (video && videoUrl && (!video.src || video.src === '')) {
                        video.src = `/api/proxy/video?url=${encodeURIComponent(videoUrl)}`;
                        video.load();
                    }

                    // Reproducir video si existe Y (no se provee isActive o isActive es true)
                    if (video && (isActive === undefined || isActive === true)) {
                        video.play().catch(() => {
                            // Silently fail if autoplay is blocked
                        });
                    }

                    // Trackear view (solo una vez por sesión)
                    if (contentId && typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(`viewed_${contentId}`)) {
                        fetch(`/api/track/view?id=${contentId}`).catch(() => { });
                        sessionStorage.setItem(`viewed_${contentId}`, 'true');
                    }
                } else if (video) {
                    video.pause();
                }
            },
            {
                rootMargin: '200px 0px', // Precarga 200px antes de entrar
                threshold: 0.1
            }
        );

        observer.observe(container);
        return () => observer.disconnect();
    }, [contentId, videoUrl, isActive]);

    // Sincronizar play/pause con el estado activo (TikTok style)
    useEffect(() => {
        const video = videoRef.current;
        if (!video || isActive === undefined) return;

        if (isActive) {
            video.play().catch(() => { });
        } else {
            video.pause();
        }
    }, [isActive]);

    // Handler para click → va al sitio/afiliado
    const handleClick = () => {
        const url = hasAffiliate && affiliateUrl ? affiliateUrl : officialWebsite;
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    // Toggle mute
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMuted(!muted);
    };

    // Determinar tipo efectivo (fallback en mobile para iframes)
    const effectiveType = (type === 'iframe' && isMobile && hasError)
        ? 'image'
        : type;

    // Render contenido
    const renderContent = () => {
        if (hasError && (posterUrl || imageUrl)) {
            return (
                <img
                    src={posterUrl || imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
            );
        }

        switch (effectiveType) {
            case 'video':
            case 'gif':
                return (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted={muted}
                        loop
                        playsInline
                        preload="none"
                        poster={posterUrl}
                        onLoadedData={() => setIsLoaded(true)}
                        onError={() => setHasError(true)}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                    />
                );

            case 'iframe':
                return (
                    <iframe
                        src={iframeUrl}
                        sandbox="allow-scripts allow-same-origin allow-popups-to-escape-sandbox"
                        loading="lazy"
                        allow="autoplay; encrypted-media"
                        className="w-full h-full border-0 pointer-events-none"
                        title="Site Preview"
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setHasError(true)}
                    />
                );

            case 'embed':
                return (
                    <div
                        dangerouslySetInnerHTML={{ __html: embedCode || '' }}
                        className="w-full h-full pointer-events-none"
                    />
                );

            case 'image':
            default:
                return (
                    <img
                        src={imageUrl || posterUrl || '/placeholder.jpg'}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setHasError(true)}
                    />
                );
        }
    };

    return (
        <div
            ref={containerRef}
            onClick={handleClick}
            className={`relative w-full h-full overflow-hidden bg-black cursor-pointer ${className}`}
        >
            {/* Loading placeholder */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Contenido principal */}
            {renderContent()}

            {/* Botón mute (solo para video/gif) */}
            {(effectiveType === 'video' || effectiveType === 'gif') && !hasError && (
                <button
                    onClick={toggleMute}
                    className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 rounded-full p-2.5 transition-colors z-10 backdrop-blur-sm"
                    aria-label={muted ? 'Activar sonido' : 'Silenciar'}
                >
                    {muted ? (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                    )}
                </button>
            )}

            {/* Badge Premium */}
            {hasAffiliate && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg">
                    ⭐ Premium
                </div>
            )}

            {/* Indicador LIVE */}
            {effectiveType === 'embed' && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                </div>
            )}
        </div>
    );
}

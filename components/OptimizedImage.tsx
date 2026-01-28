'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fallbackSrc?: string;
}

// Placeholder blur genérico (gris oscuro para VENUZ)
const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQA=";

// Fallback por categoría
const CATEGORY_FALLBACKS: Record<string, string> = {
  escort: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=60",
  modelo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=60",
  club: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&q=60",
  bar: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=60",
  evento: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=60",
  default: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=60",
};

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  priority = false,
  sizes,
  fallbackSrc,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { effectiveType, saveData } = useNetworkStatus();

  // Determinar calidad según conexión
  const getQuality = (): number => {
    if (saveData) return 40;
    switch (effectiveType) {
      case "slow-2g":
      case "2g":
        return 40;
      case "3g":
        return 60;
      case "4g":
      default:
        return 75;
    }
  };

  // Filtrar URLs problemáticas de Google
  const sanitizeUrl = (url: string): string => {
    if (!url) return CATEGORY_FALLBACKS.default;
    if (url.includes("googleapis.com") || url.includes("googleusercontent.com") || url.includes("google.com/maps")) {
      return CATEGORY_FALLBACKS.default;
    }
    return url;
  };

  // URL final (con fallback si hay error o URL problemática)
  const imageSrc = error
    ? (fallbackSrc || CATEGORY_FALLBACKS.default)
    : sanitizeUrl(src);

  // Determinar sizes responsivos si no se proporcionan
  const defaultSizes = sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader mientras carga */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
      )}

      <Image
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        quality={getQuality()}
        priority={priority}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        sizes={defaultSizes}
        className={`
          transition-opacity duration-500
          ${loaded ? "opacity-100" : "opacity-0"}
          ${fill ? "object-cover" : ""}
        `}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
      />
    </div>
  );
}

export default OptimizedImage;

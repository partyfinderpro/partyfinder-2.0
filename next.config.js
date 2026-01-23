// @ts-check

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|webp|gif|svg|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "venuz-images",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "venuz-fonts",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
      {
        urlPattern: /^https:\/\/.*supabase.*\/rest\/v1\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "venuz-api",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 5,
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

// Bundle analyzer (solo cuando se necesita)
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Compresión
  compress: true,
  
  // Optimización de imágenes
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.camsoda.com" },
      { protocol: "https", hostname: "*.stripchat.com" },
      { protocol: "https", hostname: "*.chaturbate.com" },
    ],
    // Formatos modernos
    formats: ["image/avif", "image/webp"],
    // Tamaños de dispositivo para srcset
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Tamaños de imagen para srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimizar calidad por defecto
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días
  },

  // Optimización experimental
  experimental: {
    // Optimizar imports de paquetes grandes
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@supabase/supabase-js",
    ],
  },

  // Headers de seguridad y performance
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Cache de assets estáticos
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          // Seguridad
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      // Cache específico para imágenes
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache para fuentes
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Producción only
    if (!dev && !isServer) {
      // Tree shaking más agresivo
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
      };
    }

    return config;
  },

  // Eliminar console.log en producción
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
};

// Aplicar plugins
module.exports = withBundleAnalyzer(withPWA(nextConfig));

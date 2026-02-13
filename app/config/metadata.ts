import type { Metadata } from "next";

const APP_NAME = "VENUZ";
const APP_DEFAULT_TITLE = "VENUZ - Entretenimiento Adulto México";
const APP_TITLE_TEMPLATE = "%s | VENUZ";
const APP_DESCRIPTION = "Descubre la mejor vida nocturna, perfiles verificados, clubs y eventos en México. Tu guía definitiva con geolocalización e inteligencia artificial.";
const BASE_URL = "https://labelbabel.com";

export function getMetadata(): Metadata {
    return {
        metadataBase: new URL(BASE_URL),
        applicationName: APP_NAME,
        title: {
            default: APP_DEFAULT_TITLE,
            template: APP_TITLE_TEMPLATE,
        },
        description: APP_DESCRIPTION,
        manifest: "/manifest.json",

        appleWebApp: {
            capable: true,
            statusBarStyle: "black-translucent",
            title: APP_NAME,
        },

        formatDetection: {
            telephone: false,
        },

        openGraph: {
            type: "website",
            siteName: APP_NAME,
            title: { default: APP_DEFAULT_TITLE, template: APP_TITLE_TEMPLATE },
            description: APP_DESCRIPTION,
            locale: "es_MX",
            images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "VENUZ" }],
        },

        twitter: {
            card: "summary_large_image",
            title: { default: APP_DEFAULT_TITLE, template: APP_TITLE_TEMPLATE },
            description: APP_DESCRIPTION,
            images: ["/og-image.png"],
        },

        keywords: [
            "México",
            "vida nocturna",
            "escorts",
            "clubs",
            "webcams",
            "eventos",
            "VENUZ",
            "entretenimiento adulto",
        ],

        authors: [{ name: "VENUZ", url: BASE_URL }],

        robots: {
            index: true,
            follow: true,
        },

        icons: {
            icon: [{ url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" }],
            apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
        },
    };
}

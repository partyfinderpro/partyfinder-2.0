import { BaseSCE } from "./base-sce";

export class SCEAdult extends BaseSCE {
    constructor() {
        super("adult");
    }

    async scrape() {
        // Fuentes dummy de alta calidad para pruebas
        return [
            {
                id: "adult-vip-001",
                title: "VIP Escort Service - Luxury Companions",
                description: "Experiencia exclusiva con modelos verificadas. Servicio 24/7 en tu hotel o domicilio.",
                image_url: "https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=2070&auto=format&fit=crop",
                source: "premium_listings",
                location: { lat: 20.6534, lng: -105.2253 }
            },
            {
                id: "adult-cams-002",
                title: "Live Cams & Private Shows",
                description: "Conecta con modelos locales en vivo. Shows privados disponibles ahora.",
                image_url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=2069&auto=format&fit=crop",
                source: "affiliate_network"
            },
            {
                id: "adult-dating-003",
                title: "Encuentros Discretos PV",
                description: "La app #1 para citas casuales en Puerto Vallarta. Regístrate gratis.",
                image_url: "https://images.unsplash.com/photo-1570158268183-d296b2892211?q=80&w=1974&auto=format&fit=crop",
                source: "dating_app_promo"
            },
            {
                id: "adult-massage-004",
                title: "Tantra Massage Experience",
                description: "Relajación total con final feliz opcional. Terapeutas certificadas.",
                image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop",
                source: "local_spa"
            },
            {
                id: "adult-club-005",
                title: "Gentlemen's Club VIP Access",
                description: "Acceso sin fila y mesa reservada en el mejor club de la ciudad.",
                image_url: "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?q=80&w=2070&auto=format&fit=crop",
                source: "nightlife_partners"
            }
        ];
    }
}

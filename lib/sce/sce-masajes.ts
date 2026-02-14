import { BaseSCE } from "./base-sce";

export class SCEMasajes extends BaseSCE {
    constructor() {
        super("masaje");
    }

    async scrape() {
        return [
            {
                id: "spa-holistico",
                title: "Spa Holístico Vallarta",
                description: "Masajes relajantes, piedras calientes y aromaterapia.",
                image_url: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=2070&auto=format&fit=crop",
                source: "google_places",
                location: { lat: 20.64, lng: -105.23 }
            },
            {
                id: "spa-marina",
                title: "Marina Wellness Center",
                description: "Terapias avanzadas y faciales de lujo. Descuento para locales.",
                image_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop",
                source: "facebook_ads"
            },
            {
                id: "massage-beach",
                title: "Masaje Frente al Mar",
                description: "Carpa privada en la playa. El sonido de las olas te relajará.",
                image_url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=2149&auto=format&fit=crop",
                source: "airbnb_experience"
            },
            {
                id: "thai-massage",
                title: "Traditional Thai Massage",
                description: "Auténtico masaje tailandés para estiramiento y relajación profunda.",
                image_url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=2070&auto=format&fit=crop",
                source: "google_maps"
            },
            {
                id: "couples-spa",
                title: "Paquete Romántico Parejas",
                description: "Masaje simultáneo, jacuzzi privado y champaña.",
                image_url: "https://images.unsplash.com/photo-1531855627622-79015c7e3f6d?q=80&w=2070&auto=format&fit=crop",
                source: "hotel_website"
            }
        ];
    }
}

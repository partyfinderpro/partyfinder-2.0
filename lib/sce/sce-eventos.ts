import { BaseSCE } from "./base-sce";

export class SCEEventos extends BaseSCE {
    constructor() {
        super("evento");
    }

    async scrape() {
        return [
            {
                id: "evt-sun-fest",
                title: "Vallarta Sun Festival",
                description: "Festival de música electrónica en la playa. 12 horas de música non-stop.",
                image_url: "https://images.unsplash.com/photo-1459749411177-0473ef48ee23?q=80&w=2070&auto=format&fit=crop",
                source: "ticketmaster",
                location: { lat: 20.68, lng: -105.25 }
            },
            {
                id: "evt-wine-fest",
                title: "Wine & Jazz Night",
                description: "Cata de vinos exclusiva con jazz en vivo en Marina Vallarta.",
                image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop",
                source: "facebook_events"
            },
            {
                id: "evt-pride-parade",
                title: "PV Pride Parade 2026",
                description: "El desfile del orgullo más grande de la costa. Color, música y celebración.",
                image_url: "https://images.unsplash.com/photo-1561587525-4fc142345d8b?q=80&w=2070&auto=format&fit=crop",
                source: "community_calendar"
            },
            {
                id: "evt-art-walk",
                title: "Art Walk Centro Histórico",
                description: "Recorrido por las mejores galerías de arte con coctel de bienvenida.",
                image_url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=2080&auto=format&fit=crop",
                source: "culture_dept"
            },
            {
                id: "evt-beach-yoga",
                title: "Sunset Beach Yoga",
                description: "Clase masiva de yoga al atardecer. Gratis y abierta a todos.",
                image_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2070&auto=format&fit=crop",
                source: "wellness_group"
            }
        ];
    }
}

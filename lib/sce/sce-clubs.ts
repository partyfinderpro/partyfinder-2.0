import { BaseSCE } from "./base-sce";

export class SCEClubs extends BaseSCE {
    constructor() {
        super("clubs");
    }

    async scrape() {
        return [
            {
                id: "club-mandala-pv",
                title: "Mandala Nightclub Official",
                description: "La experiencia nocturna definitiva en Puerto Vallarta. Open bar disponible.",
                image_url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=2070&auto=format&fit=crop",
                source: "google_places",
                location: { lat: 20.6534, lng: -105.2253 }
            },
            {
                id: "club-senor-frogs",
                title: "Señor Frog's Foam Party",
                description: "¡Fiesta de espuma todos los miércoles! Diversión sin límites y yardas de bebida.",
                image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop",
                source: "facebook_events"
            },
            {
                id: "club-la-santa",
                title: "La Santa Vallarta",
                description: "Estilo, glamour y la mejor música electrónica. El lugar para ver y ser visto.",
                image_url: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=1974&auto=format&fit=crop",
                source: "instagram_official"
            },
            {
                id: "club-six-pv",
                title: "Six Club Vallarta",
                description: "Underground vibes y los mejores DJs locales. Abierto hasta el amanecer.",
                image_url: "https://images.unsplash.com/photo-1574100004472-e536d3b6b48c?q=80&w=2070&auto=format&fit=crop",
                source: "local_directory"
            },
            {
                id: "club-strass",
                title: "Strana Disco",
                description: "El palacio de la fiesta. Techos altos, candelabros y show de luces impresionante.",
                image_url: "https://images.unsplash.com/photo-1545128485-c400e77d2758?q=80&w=2070&auto=format&fit=crop",
                source: "tripadvisor_top"
            }
        ];
    }
}

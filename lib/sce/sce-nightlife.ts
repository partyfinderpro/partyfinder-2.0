
import { BaseSCE } from "./base-sce";

export class SCENightlife extends BaseSCE {
    constructor() {
        super("nightlife");
    }

    async scrape() {
        // Aquí va tu lógica actual de scraping (Google Places, FB, IG)
        // Por ahora usa datos dummy para probar y validar la integración
        return [
            {
                id: "mandal-beach-test",
                title: "Fiesta en Mandala Beach",
                description: "El mejor evento de playa de día, música electrónica y bebidas.",
                image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop",
                source: "facebook",
                location: { lat: 20.6296, lng: -105.2310 } // PV
            },
            {
                id: "senor-frog-test",
                title: "Señor Frogs Foam Party",
                description: "Fiesta de espuma clásica en Puerto Vallarta. Diversión garantizada.",
                image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop",
                source: "google_places"
            },
            {
                id: "la-santa-test",
                title: "La Santa Nightclub",
                description: "La discoteca más exclusiva de la zona. Dress code estricto.",
                image_url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=2070&auto=format&fit=crop",
                source: "instagram"
            }
        ];
    }
}

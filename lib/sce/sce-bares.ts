import { BaseSCE } from "./base-sce";

export class SCEBares extends BaseSCE {
    constructor() {
        super("bar");
    }

    async scrape() {
        return [
            {
                id: "bar-frida",
                title: "Bar Frida",
                description: "Ambiente relajado, excelentes margaritas y buena música local.",
                image_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop",
                source: "google_maps",
                location: { lat: 20.60, lng: -105.23 }
            },
            {
                id: "bar-bodeguita",
                title: "La Bodeguita del Medio",
                description: "El auténtico sabor cubano en PV. Mojitos, salsa en vivo y pura vida.",
                image_url: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=1974&auto=format&fit=crop",
                source: "facebook_places"
            },
            {
                id: "bar-el-solar",
                title: "El Solar Beach Bar",
                description: "Los mejores atardeceres con pie en la arena. DJs invitados fines de semana.",
                image_url: "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?q=80&w=1974&auto=format&fit=crop",
                source: "instagram_location"
            },
            {
                id: "bar-morelos",
                title: "Bar Morelos",
                description: "Elegancia y coctelería de autor en el corazón del malecón.",
                image_url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2069&auto=format&fit=crop",
                source: "local_guide"
            },
            {
                id: "bar-colibri",
                title: "Colibrí Cocktail Garden",
                description: "Jardín secreto con mixología experta. Un oasis en la ciudad.",
                image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=2157&auto=format&fit=crop",
                source: "tripadvisor"
            }
        ];
    }
}

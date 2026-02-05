export interface VenueSEO {
    name: string;
    address: string;
    description?: string;
    image?: string;
    geo: { lat: number; lng: number };
    url?: string;
}

export interface EventSEO {
    name: string;
    startDate: string;
    endDate?: string;
    description?: string;
    image?: string;
    venueId?: string; // Optional if using embedded Logic
    location?: VenueSEO; // Embedded location
    url?: string;
    offers?: {
        price: string;
        currency?: string;
        url?: string;
    };
}

export class SEOHelpers {

    /**
     * Generates JSON-LD for NightClubs/Bars (Venues)
     */
    static venueSchema(venue: VenueSEO) {
        return {
            "@context": "https://schema.org",
            "@type": "NightClub", // Or Bar, AdultEntertainment
            name: venue.name,
            description: venue.description,
            image: venue.image,
            address: venue.address,
            geo: {
                "@type": "GeoCoordinates",
                latitude: venue.geo.lat,
                longitude: venue.geo.lng
            },
            url: venue.url
        };
    }

    /**
     * Generates JSON-LD for Events (Parties, Concerts)
     */
    static eventSchema(event: EventSEO) {
        const schema: any = {
            "@context": "https://schema.org",
            "@type": "Event",
            name: event.name,
            startDate: event.startDate,
            description: event.description,
            image: event.image,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            url: event.url
        };

        if (event.endDate) {
            schema.endDate = event.endDate;
        }

        if (event.location) {
            schema.location = {
                "@type": "Place",
                name: event.location.name,
                address: event.location.address,
                geo: {
                    "@type": "GeoCoordinates",
                    latitude: event.location.geo.lat,
                    longitude: event.location.geo.lng
                }
            };
        }

        if (event.offers) {
            schema.offers = {
                "@type": "Offer",
                price: event.offers.price,
                priceCurrency: event.offers.currency || "MXN",
                url: event.offers.url,
                availability: "https://schema.org/InStock"
            };
        }

        return schema;
    }

    /**
     * Generates XML Sitemap string
     */
    static generateSitemap(urls: string[]): string {
        const items = urls.map(
            u => `<url><loc>${u}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>daily</changefreq></url>`
        ).join("");

        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`;
    }
}

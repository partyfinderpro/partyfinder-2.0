interface SchemaOrgType {
    "@context": string;
    "@type": string;
    [key: string]: any;
}

export function getSchemaOrg(): SchemaOrgType[] {
    return [
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "VENUZ",
            url: "https://labelbabel.com",
            logo: "https://labelbabel.com/logo.png",
            description: "La plataforma líder de entretenimiento adulto y vida nocturna en México",
            foundingDate: "2025",
            address: {
                "@type": "PostalAddress",
                addressLocality: "Puerto Vallarta",
                addressRegion: "Jalisco",
                addressCountry: "MX",
            },
            sameAs: [
                "https://twitter.com/venuzapp",
                "https://telegram.me/venuzoficial",
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "VENUZ",
            url: "https://labelbabel.com",
            potentialAction: {
                "@type": "SearchAction",
                target: "https://labelbabel.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
            },
        },
    ];
}

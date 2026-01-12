/**
 * VENUZ Tag Extractor - Extracción inteligente de tags premium
 * Busca palabras clave en títulos y descripciones
 */

interface TagPattern {
    tag: string;
    patterns: RegExp[];
    priority: number; // Mayor = más importante
}

const TAG_PATTERNS: TagPattern[] = [
    // LGBTQ+ Friendly
    {
        tag: 'LGBTQ+',
        priority: 10,
        patterns: [
            /lgbtq\+?/i,
            /gay[\s-]?friendly/i,
            /pride/i,
            /drag\s+(show|queen)/i,
            /gay\s+bar/i,
            /lesbian/i,
            /queer/i,
            /rainbow/i,
            /zona\s+gay/i
        ]
    },

    // Vistas y ubicación premium
    {
        tag: 'Vista al Mar',
        priority: 9,
        patterns: [
            /ocean\s+view/i,
            /sea\s+view/i,
            /beach\s+front/i,
            /frente\s+al\s+mar/i,
            /vista\s+al\s+mar/i,
            /vista\s+océano/i,
            /waterfront/i
        ]
    },
    {
        tag: 'Rooftop',
        priority: 9,
        patterns: [
            /rooftop/i,
            /azotea/i,
            /terraza/i,
            /terrace/i,
            /sky\s+bar/i
        ]
    },
    {
        tag: 'Zona Romántica',
        priority: 8,
        patterns: [
            /zona\s+romántica/i,
            /romantic\s+zone/i,
            /old\s+town/i,
            /centro\s+histórico/i
        ]
    },

    // Música y entretenimiento
    {
        tag: 'Música en Vivo',
        priority: 8,
        patterns: [
            /live\s+music/i,
            /música\s+en\s+vivo/i,
            /live\s+band/i,
            /banda\s+en\s+vivo/i,
            /dj/i
        ]
    },
    {
        tag: 'Karaoke',
        priority: 7,
        patterns: [/karaoke/i]
    },
    {
        tag: 'Drag Show',
        priority: 8,
        patterns: [
            /drag\s+show/i,
            /drag\s+queen/i,
            /transformista/i
        ]
    },

    // Servicios y comodidades
    {
        tag: 'Pet Friendly',
        priority: 7,
        patterns: [
            /pet[\s-]?friendly/i,
            /dog[\s-]?friendly/i,
            /acepta\s+mascotas/i,
            /pet\s+allowed/i
        ]
    },
    {
        tag: 'WiFi Gratis',
        priority: 6,
        patterns: [
            /free\s+wifi/i,
            /wifi\s+gratis/i,
            /complimentary\s+wifi/i
        ]
    },
    {
        tag: 'Estacionamiento',
        priority: 6,
        patterns: [
            /parking/i,
            /estacionamiento/i,
            /valet/i,
            /garage/i
        ]
    },
    {
        tag: 'Alberca',
        priority: 7,
        patterns: [
            /pool/i,
            /alberca/i,
            /piscina/i,
            /infinity\s+pool/i,
            /rooftop\s+pool/i
        ]
    },
    {
        tag: 'Spa',
        priority: 7,
        patterns: [
            /spa/i,
            /massage/i,
            /masaje/i,
            /wellness/i,
            /sauna/i,
            /jacuzzi/i
        ]
    },

    // Opciones dietéticas
    {
        tag: 'Vegetariano',
        priority: 7,
        patterns: [
            /vegetarian/i,
            /vegetariano/i,
            /veggie/i
        ]
    },
    {
        tag: 'Vegano',
        priority: 7,
        patterns: [
            /vegan/i,
            /vegano/i,
            /plant[\s-]?based/i
        ]
    },
    {
        tag: 'Sin Gluten',
        priority: 7,
        patterns: [
            /gluten[\s-]?free/i,
            /sin\s+gluten/i,
            /celiac/i
        ]
    },

    // Experiencias
    {
        tag: 'All You Can Eat',
        priority: 6,
        patterns: [
            /all[\s-]?you[\s-]?can[\s-]?eat/i,
            /buffet/i,
            /barra\s+libre/i
        ]
    },
    {
        tag: 'Happy Hour',
        priority: 7,
        patterns: [
            /happy\s+hour/i,
            /2\s*x\s*1/i,
            /two\s+for\s+one/i,
            /2\s*for\s*1/i
        ]
    },
    {
        tag: 'Admisión Gratis',
        priority: 8,
        patterns: [
            /free\s+entry/i,
            /no\s+cover/i,
            /entrada\s+gratis/i,
            /sin\s+cover/i,
            /ladies\s+free/i
        ]
    },
    {
        tag: 'Open Bar',
        priority: 8,
        patterns: [
            /open\s+bar/i,
            /barra\s+libre/i,
            /unlimited\s+drinks/i
        ]
    },

    // Características premium
    {
        tag: 'VIP',
        priority: 9,
        patterns: [
            /vip/i,
            /bottle\s+service/i,
            /table\s+service/i,
            /servicio\s+de\s+mesa/i,
            /reserva\s+vip/i
        ]
    },
    {
        tag: 'Luxury',
        priority: 9,
        patterns: [
            /luxury/i,
            /lujo/i,
            /5[\s-]?star/i,
            /cinco\s+estrellas/i,
            /premium/i,
            /exclusive/i,
            /exclusivo/i
        ]
    },
    {
        tag: 'Budget Friendly',
        priority: 7,
        patterns: [
            /budget/i,
            /affordable/i,
            /económico/i,
            /barato/i,
            /cheap/i,
            /backpacker/i
        ]
    },

    // Seguridad y conveniencia
    {
        tag: '24 Horas',
        priority: 7,
        patterns: [
            /24[\s-]?hours/i,
            /24[\s-]?hrs/i,
            /24[\s\/]?7/i,
            /abierto\s+24\s+horas/i,
            /open\s+24\s+hours/i
        ]
    },
    {
        tag: 'Entrega a Domicilio',
        priority: 6,
        patterns: [
            /delivery/i,
            /entrega\s+a\s+domicilio/i,
            /uber\s+eats/i,
            /rappi/i,
            /didi\s+food/i
        ]
    },

    // Spring Break
    {
        tag: 'Spring Break',
        priority: 8,
        patterns: [
            /spring\s+break/i,
            /college\s+party/i,
            /student\s+discount/i
        ]
    },

    // Medical Tourism
    {
        tag: 'English Speaking',
        priority: 9,
        patterns: [
            /english[\s-]?speaking/i,
            /se\s+habla\s+inglés/i,
            /bilingual/i,
            /bilingüe/i
        ]
    },
    {
        tag: 'Turismo Médico',
        priority: 9,
        patterns: [
            /medical\s+tourism/i,
            /turismo\s+médico/i,
            /cosmetic\s+surgery/i,
            /cirugía\s+estética/i,
            /dental\s+tourism/i
        ]
    }
];

/**
 * Extrae tags de un texto (título + descripción)
 */
export function extractTags(
    title: string = '',
    description: string = '',
    additionalText: string = ''
): string[] {
    const fullText = `${title} ${description} ${additionalText}`;
    const foundTags: Set<string> = new Set();

    // Buscar cada patrón
    for (const { tag, patterns } of TAG_PATTERNS) {
        for (const pattern of patterns) {
            if (pattern.test(fullText)) {
                foundTags.add(tag);
                break; // No necesitamos seguir buscando para este tag
            }
        }
    }

    // Ordenar por prioridad
    const sorted = Array.from(foundTags).sort((a, b) => {
        const prioA = TAG_PATTERNS.find(p => p.tag === a)?.priority || 0;
        const prioB = TAG_PATTERNS.find(p => p.tag === b)?.priority || 0;
        return prioB - prioA;
    });

    // Limitar a 5 tags más relevantes
    return sorted.slice(0, 5);
}

/**
 * Añade tags basados en otros metadatos
 */
export function addMetadataTags(
    existingTags: string[],
    metadata: {
        priceLevel?: number;
        rating?: number;
        isOpenNow?: boolean;
        category?: string;
    }
): string[] {
    const tags = new Set(existingTags);

    // Tag por precio
    if (metadata.priceLevel) {
        if (metadata.priceLevel === 1) tags.add('Budget Friendly');
        if (metadata.priceLevel >= 4) tags.add('Luxury');
    }

    // Tag por rating
    if (metadata.rating && metadata.rating >= 4.5) {
        tags.add('Altamente Calificado');
    }

    // Tag si está abierto ahora
    if (metadata.isOpenNow) {
        tags.add('Abierto Ahora');
    }

    // Tags por categoría
    if (metadata.category === 'nightlife') {
        // Ya cubierto por otros tags
    }

    return Array.from(tags).slice(0, 6); // Max 6 tags
}

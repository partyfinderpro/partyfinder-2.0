/**
 * VENUZ Category Mapper - Mapeo exhaustivo de tipos de Google/Foursquare a categorías VENUZ
 * Cubre 200+ tipos diferentes de lugares
 */

export type VenuzCategory =
    | 'nightlife'
    | 'food'
    | 'hospitality'
    | 'medical'
    | 'transport'
    | 'culture'
    | 'event';

interface CategoryMapping {
    venuz: VenuzCategory;
    keywords: string[];
    priority: number; // 1-5, mayor = más específico
}

/**
 * CATEGORÍA: NIGHTLIFE
 * Clubs, bares, antros, vida nocturna
 */
const NIGHTLIFE_TYPES: CategoryMapping = {
    venuz: 'nightlife',
    priority: 5,
    keywords: [
        // Google Places types
        'night_club',
        'bar',
        'dance_club',
        'disco',
        'cocktail_bar',
        'gay_bar',
        'karaoke',
        'live_music_venue',
        'jazz_club',
        'blues_club',
        'strip_club',
        'adult_entertainment',
        'cabaret',
        'lounge',
        'pub',
        'nightclub',

        // Foursquare categories
        'nightlife spot',
        'nightclub',
        'dance club',
        'cocktail bar',
        'dive bar',
        'gay bar',
        'hookah bar',
        'karaoke bar',
        'nightlife',
        'beer bar',
        'whisky bar',
        'wine bar',
        'tiki bar',
        'sports bar',
        'rooftop bar',
        'beach bar',
        'pool bar',

        // Yelp aliases
        'danceclubs',
        'jazzandblues',
        'cocktailbars',
        'divebars',
        'gaybars',
        'hookah_bars',
        'karaoke',
        'musicvenues',
        'poolhalls',
        'sportsbars',
        'tikibars',
        'wine_bars',

        // Palabras clave en nombres/descripciones
        'antro',
        'discoteca',
        'disco',
        'club nocturno',
        'after hours',
        'after party',
        'dancing',
        'dj',
        'edm',
        'reggaeton',
        'salsa club',
        'latino club'
    ]
};

/**
 * CATEGORÍA: FOOD
 * Restaurantes, cafés, food trucks
 */
const FOOD_TYPES: CategoryMapping = {
    venuz: 'food',
    priority: 4,
    keywords: [
        // Google Places
        'restaurant',
        'cafe',
        'food',
        'meal_delivery',
        'meal_takeaway',
        'bakery',
        'coffee_shop',
        'ice_cream_shop',
        'pizza_restaurant',
        'seafood_restaurant',
        'steak_house',
        'sushi_restaurant',
        'vegetarian_restaurant',
        'vegan_restaurant',
        'brunch_restaurant',
        'breakfast_restaurant',
        'american_restaurant',
        'mexican_restaurant',
        'italian_restaurant',
        'chinese_restaurant',
        'japanese_restaurant',
        'thai_restaurant',
        'indian_restaurant',
        'french_restaurant',
        'mediterranean_restaurant',
        'fast_food_restaurant',
        'hamburger_restaurant',
        'sandwich_shop',

        // Foursquare
        'food & drink',
        'restaurant',
        'café',
        'coffee shop',
        'diner',
        'fast food',
        'food court',
        'food stand',
        'food truck',
        'eatery',
        'bistro',
        'brasserie',
        'steakhouse',
        'seafood restaurant',
        'taco place',
        'taqueria',
        'burrito place',
        'juice bar',
        'smoothie shop',
        'dessert shop',
        'ice cream shop',
        'gelato shop',
        'donut shop',
        'cupcake shop',

        // Yelp
        'restaurants',
        'cafes',
        'coffee',
        'breakfast_brunch',
        'seafood',
        'steakhouses',
        'sushi',
        'mexican',
        'italian',
        'chinese',
        'thai',
        'indian',
        'mediterranean',
        'vegetarian',
        'vegan',
        'gluten_free',
        'food_trucks',
        'foodstands',

        // Keywords
        'restaurante',
        'comida',
        'cocina',
        'mariscos',
        'tacos',
        'tortas',
        'breakfast',
        'brunch',
        'lunch',
        'dinner',
        'buffet',
        'all you can eat'
    ]
};

/**
 * CATEGORÍA: HOSPITALITY
 * Hoteles, hostels, alojamiento
 */
const HOSPITALITY_TYPES: CategoryMapping = {
    venuz: 'hospitality',
    priority: 5,
    keywords: [
        // Google Places
        'lodging',
        'hotel',
        'motel',
        'resort',
        'hostel',
        'guest_house',
        'bed_and_breakfast',
        'serviced_apartment',
        'extended_stay_hotel',
        'apartment_rental',
        'vacation_rental',
        'rv_park',
        'campground',

        // Foursquare
        'hotel',
        'hostel',
        'resort',
        'bed & breakfast',
        'vacation rental',
        'motel',
        'lodge',
        'inn',
        'boutique hotel',
        'spa resort',
        'beach resort',
        'all-inclusive resort',

        // Yelp
        'hotels',
        'hostels',
        'bedbreakfast',
        'guesthouses',
        'resorts',
        'apartments',
        'vacation_rentals',
        'camping',
        'rv_parks',

        // Keywords
        'hospedaje',
        'alojamiento',
        'habitación',
        'suite',
        'villa',
        'departamento',
        'airbnb',
        'casa de huéspedes',
        'posada',
        'cabaña'
    ]
};

/**
 * CATEGORÍA: MEDICAL
 * Clínicas, farmacias, spas, wellness
 */
const MEDICAL_TYPES: CategoryMapping = {
    venuz: 'medical',
    priority: 5,
    keywords: [
        // Google Places
        'doctor',
        'dentist',
        'hospital',
        'pharmacy',
        'health',
        'medical_clinic',
        'dental_clinic',
        'physiotherapist',
        'spa',
        'beauty_salon',
        'hair_salon',
        'hair_care',
        'nail_salon',
        'massage',
        'chiropractor',
        'acupuncture',
        'optometrist',
        'veterinary_care',

        // Foursquare
        'doctor',
        'dentist',
        'hospital',
        'medical center',
        'pharmacy',
        'urgent care',
        'spa',
        'massage studio',
        'nail salon',
        'hair salon',
        'cosmetic surgery',
        'plastic surgeon',
        'dermatologist',
        'wellness center',
        'yoga studio',
        'meditation center',

        // Yelp
        'physicians',
        'dentists',
        'hospitals',
        'pharmacy',
        'health',
        'medspas',
        'spas',
        'massage',
        'hairremoval',
        'skincare',
        'plastic_surgeons',
        'cosmeticsurgeons',
        'IV_hydration',

        // Medical Tourism Keywords
        'dental implants',
        'dental tourism',
        'cosmetic surgery',
        'plastic surgery',
        'liposuction',
        'tummy tuck',
        'breast augmentation',
        'rhinoplasty',
        'botox',
        'fillers',
        'laser',
        'weight loss',
        'bariatric',
        'fertility',
        'ivf',
        'stem cell',
        'clínica',
        'farmacia',
        'consultorio',
        'cirugía estética',
        'odontología',
        'implantes dentales'
    ]
};

/**
 * CATEGORÍA: TRANSPORT
 * Taxis, rentas, transporte
 */
const TRANSPORT_TYPES: CategoryMapping = {
    venuz: 'transport',
    priority: 4,
    keywords: [
        // Google Places
        'taxi_stand',
        'car_rental',
        'car_dealer',
        'car_wash',
        'gas_station',
        'parking',
        'transit_station',
        'bus_station',
        'airport',
        'boat_tour',
        'ferry_terminal',

        // Foursquare
        'taxi',
        'car rental',
        'bike rental',
        'scooter rental',
        'boat rental',
        'charter',
        'transportation service',
        'airport',
        'bus station',
        'ferry',

        // Yelp
        'taxis',
        'carrental',
        'bikerentals',
        'boatcharters',
        'airport_shuttles',
        'publictransport',
        'parking',

        // Keywords
        'taxi',
        'uber',
        'transporte',
        'renta de autos',
        'renta de motos',
        'scooter',
        'bicicleta',
        'lancha',
        'yate',
        'charter',
        'shuttle',
        'traslado'
    ]
};

/**
 * CATEGORÍA: CULTURE
 * Museos, tours, actividades culturales
 */
const CULTURE_TYPES: CategoryMapping = {
    venuz: 'culture',
    priority: 3,
    keywords: [
        // Google Places
        'tourist_attraction',
        'museum',
        'art_gallery',
        'performing_arts_theater',
        'movie_theater',
        'cultural_center',
        'historical_landmark',
        'church',
        'park',
        'aquarium',
        'zoo',
        'amusement_park',
        'beach',
        'natural_feature',
        'hiking_area',
        'national_park',

        // Foursquare
        'museum',
        'art gallery',
        'historic site',
        'monument',
        'lighthouse',
        'beach',
        'scenic lookout',
        'plaza',
        'park',
        'botanical garden',
        'zoo',
        'aquarium',
        'theater',
        'opera house',
        'concert hall',
        'cultural center',
        'trail',

        // Yelp
        'museums',
        'artgalleries',
        'theaters',
        'culturalcenter',
        'festivals',
        'landmarks',
        'tours',
        'beaches',
        'hiking',
        'parks',

        // Keywords
        'museo',
        'galería',
        'teatro',
        'malecón',
        'playa',
        'mirador',
        'tour',
        'excursión',
        'caminata',
        'snorkel',
        'buceo',
        'kayak',
        'paddle board',
        'zip line',
        'canopy',
        'free walking tour',
        'cultural',
        'histórico'
    ]
};

/**
 * CATEGORÍA: EVENT
 * Eventos específicos, conciertos, shows
 */
const EVENT_TYPES: CategoryMapping = {
    venuz: 'event',
    priority: 5,
    keywords: [
        // Foursquare/Eventbrite
        'event',
        'concert',
        'festival',
        'party',
        'show',
        'performance',
        'live music',
        'comedy show',
        'drag show',
        'burlesque',
        'sporting event',
        'conference',
        'workshop',
        'class',
        'meetup',

        // Keywords
        'evento',
        'concierto',
        'festival',
        'fiesta',
        'show',
        'presentación',
        'espectáculo',
        'obra de teatro',
        'comedia',
        'drag',
        'cabaret',
        'partido',
        'torneo',
        'exposición'
    ]
};

/**
 * MAPEO COMPLETO
 */
const ALL_MAPPINGS: CategoryMapping[] = [
    NIGHTLIFE_TYPES,
    FOOD_TYPES,
    HOSPITALITY_TYPES,
    MEDICAL_TYPES,
    TRANSPORT_TYPES,
    CULTURE_TYPES,
    EVENT_TYPES
];

/**
 * Función principal: Detecta la categoría VENUZ a partir de tipos de API
 */
export function detectCategory(
    types: string[] = [],
    name: string = '',
    description: string = ''
): VenuzCategory {
    const searchText = `${types.join(' ')} ${name} ${description}`.toLowerCase();

    // Buscar coincidencias (prioridad mayor primero)
    const sorted = ALL_MAPPINGS.sort((a, b) => b.priority - a.priority);

    for (const mapping of sorted) {
        for (const keyword of mapping.keywords) {
            if (searchText.includes(keyword.toLowerCase())) {
                return mapping.venuz;
            }
        }
    }

    // Default: si tiene "bar" o "club" → nightlife, sino → culture
    if (searchText.includes('bar') || searchText.includes('club')) {
        return 'nightlife';
    }

    return 'culture'; // Fallback genérico
}

/**
 * Variante específica para Google Places types
 */
export function detectCategoryFromGoogleTypes(types: string[]): VenuzCategory {
    return detectCategory(types, '', '');
}

/**
 * Variante específica para Foursquare categories
 */
export function detectCategoryFromFoursquare(categories: any[]): VenuzCategory {
    const categoryNames = categories.map(c => c.name || '');
    return detectCategory(categoryNames, '', '');
}

/**
 * Variante específica para Yelp categories
 */
export function detectCategoryFromYelp(categories: any[]): VenuzCategory {
    const aliases = categories.map(c => c.alias || '');
    return detectCategory(aliases, '', '');
}

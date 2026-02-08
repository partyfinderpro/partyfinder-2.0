export const FEED_WEIGHTS = {
    // Feed principal (home)
    main_feed: {
        google_places_penalty: -40,        // mínimo Google Places genérico
        concert_boost: 80,
        event_boost: 70,
        offer_2x1_boost: 60,
        barra_libre_boost: 90,
        ladies_night_boost: 70,
        new_content_boost: 40,             // added_at hoy
    },
    // Sección categorías (ej. /category/bares)
    category_feed: {
        distance_priority: 100,            // orden principal por distancia
        rating_boost: 20,                  // place.rating * multiplier
        verified_boost: 30,
        has_images_boost: 15,
    },
    // Personalización por usuario
    personal: {
        like_boost_strong: 30,
        like_boost_medium: 15,
        dislike_penalty: -20,
        min_likes_for_boost: 3,
        min_view_seconds_for_boost: 60,
    }
};

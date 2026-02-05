/**
 * SIMULACIÓN DEL HIGHWAY ALGORITHM v4.0
 * Prueba cómo cambian las proporciones del feed según la hora y preferencias.
 */

const HIGHWAY_RATIOS = {
    base: {
        eventos: 25,
        clubs: 20,
        soltero: 25,
        bares: 15,
        shows: 10,
        experiencias: 5
    },
    hour: {
        morning: { eventos: -5, bares: 10, experiencias: 5, soltero: -10 },
        evening: { clubs: 10, soltero: 10, shows: 5, experiencias: -10 },
        latenight: { clubs: 15, soltero: 15, bares: -10, experiencias: -10 }
    }
};

function simulateFeed(hour, cityPreferences = {}) {
    let ratios = { ...HIGHWAY_RATIOS.base };
    let slot = 'afternoon';

    if (hour >= 6 && hour < 12) slot = 'morning';
    else if (hour >= 18 && hour < 24) slot = 'evening';
    else if (hour >= 0 && hour < 6) slot = 'latenight';

    console.log(`\n⏰ ESCENARIO: ${slot.toUpperCase()} (${hour}:00 hrs)`);

    const mods = HIGHWAY_RATIOS.hour[slot] || {};
    for (const [key, val] of Object.entries(mods)) {
        ratios[key] = Math.max(0, ratios[key] + val);
    }

    // Normalizar a 100%
    const total = Object.values(ratios).reduce((a, b) => a + b, 0);
    console.log('📊 PROPORCIONES DEL FEED:');

    Object.entries(ratios).forEach(([cat, val]) => {
        const pct = Math.round((val / total) * 100);
        const bar = '■'.repeat(Math.round(pct / 2));
        console.log(`${cat.padEnd(12)} | ${pct}% ${bar}`);
    });
}

console.log('🚀 [SIMULACIÓN VENUZ] Probando mezcla de contenido inteligente...');
simulateFeed(10); // Mañana
simulateFeed(21); // Noche
simulateFeed(3);  // Madrugada
console.log('\n✨ El feed evoluciona solo. No más contenido estático.');

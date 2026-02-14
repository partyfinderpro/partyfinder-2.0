
import { runHibridaTour } from "@/lib/venuz-hibrida/hibrida-graph";

async function testNationalTour() {
    const cities = ["Puerto Vallarta", "Ciudad de México", "Guadalajara", "Monterrey", "Cancún"];

    for (const city of cities) {
        console.log(`\n=== Tour en ${city} ===`);
        try {
            const result = await runHibridaTour(city);
            // Handle if result is string or object
            const output = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            console.log("Resultado:", output);
        } catch (error) {
            console.error(`Error en ${city}:`, error);
        }
    }
}

// Execute if run directly
if (require.main === module) {
    testNationalTour();
}

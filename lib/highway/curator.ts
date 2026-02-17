import { HighwayContentItem } from '@/lib/highwayAlgorithm';

type FeedSlotType = 'standard' | 'hero_banner' | 'video_reel' | 'compact_grid';

interface CuratedFeedItem extends HighwayContentItem {
    slotType: FeedSlotType;
    neonEffect?: boolean; // Para CSS: brillo, borde neón, etc.
}

/**
 * THE VEGAS STRIP ALGORITHM
 * Transforma una lista plana de items en una experiencia visual dinámica.
 */
export function curateVegasStrip(items: HighwayContentItem[], userLocalHour: number = new Date().getHours()): CuratedFeedItem[] {
    const isNightMode = userLocalHour >= 20 || userLocalHour < 5;
    const curated: CuratedFeedItem[] = [];

    // Patrón de diseño (Ritmo visual)
    // 1 Hero -> 4 Standard -> 1 Video -> 4 Standard -> 1 Grid...
    let patternIndex = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let slotType: FeedSlotType = 'standard';
        let neonEffect = false;

        // Lógica de "Showstopper"
        // Si el item es Premium o tiene Score muy alto (>150), merece destacar
        const isHighValue = (item.finalScore || 0) > 150;
        const isAdultPillar = item.pillar === 'adult';

        if (i % 6 === 0) {
            // Cada 6 items, intentamos poner un HERO o VIDEO
            if (item.video_url) {
                slotType = 'video_reel';
            } else if (item.image_url && isHighValue) {
                slotType = 'hero_banner';
            }
        } else if (i % 3 === 0 && isAdultPillar && isNightMode) {
            // En modo noche, cada 3 items intentamos destacar lo "Adult" sutilmente
            neonEffect = true;
        }

        // Si es un item 'adult' pero estamos de día, lo forzamos a standard o lo ocultamos si es muy explícito
        // (Por ahora asumimos que el filtro previo ya quitó lo prohibido)
        if (!isNightMode && isAdultPillar && slotType === 'hero_banner') {
            slotType = 'standard'; // Evitar pantallazo gigante de adult de día
        }

        curated.push({
            ...item,
            slotType,
            neonEffect
        });
    }

    return curated;
}

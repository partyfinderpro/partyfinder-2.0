import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

// Types
export interface FeedItem {
    id: string;
    category?: string;
    affiliate_source?: string;
    latitude?: number;
    longitude?: number;
    [key: string]: any;
}

interface IntentionScores {
    adult: number;
    event: number;
    venue: number;
    sports: number;
}

const INITIAL_SCORES: IntentionScores = {
    adult: 25,
    event: 25,
    venue: 25,
    sports: 25,
};

// Puerto Vallarta Bounds
const PV_BOUNDS = {
    north: 20.75,
    south: 20.55,
    east: -105.15,
    west: -105.35,
};

export function useFeedMixer(rawPosts: FeedItem[] = []) {
    const searchParams = useSearchParams();
    const urlMode = searchParams?.get('mode'); // 'adult' | 'events' | 'spicy'

    const [intentionScores, setIntentionScores] = useState<IntentionScores>(() => {
        if (typeof window === 'undefined') return INITIAL_SCORES;

        // Check localStorage
        const saved = localStorage.getItem('venuz_intention_scores');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse intention scores', e);
            }
        }

        // Initial boost based on URL mode
        if (urlMode === 'adult' || urlMode === 'spicy') {
            return { adult: 85, event: 5, venue: 5, sports: 5 };
        }
        if (urlMode === 'events') {
            return { adult: 5, event: 50, venue: 40, sports: 5 };
        }

        return INITIAL_SCORES;
    });

    const [mixedFeed, setMixedFeed] = useState<FeedItem[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Persist scores
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('venuz_intention_scores', JSON.stringify(intentionScores));
        }
    }, [intentionScores]);

    // Request Location (Silent check)
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                () => console.log('Location access denied or error'),
                { timeout: 5000 }
            );
        }
    }, []);

    // Categorize Item Helper
    const getCategoryType = (item: FeedItem): keyof IntentionScores => {
        const cat = (item.category || '').toLowerCase();
        const source = (item.affiliate_source || '').toLowerCase();

        if (cat === 'escort' || cat === 'webcam' || source === 'reddit' || item.is_nsfw) return 'adult';
        if (cat === 'event' || source.includes('ticketmaster') || source.includes('eventbrite')) return 'event';
        if (cat === 'club' || cat === 'bar' || cat === 'restaurant' || source === 'googleplaces') return 'venue';
        if (cat === 'sports' || source.includes('thesportsdb')) return 'sports';

        return 'venue'; // Default
    };

    // Mix Feed Logic
    useEffect(() => {
        if (!rawPosts.length) return;

        // Check if user is in Puerto Vallarta
        const isPV = userLocation ? (
            userLocation.lat <= PV_BOUNDS.north &&
            userLocation.lat >= PV_BOUNDS.south &&
            userLocation.lng >= PV_BOUNDS.west &&
            userLocation.lng <= PV_BOUNDS.east
        ) : false;

        // 1. Calculate Target Percentages
        const totalScore = Object.values(intentionScores).reduce((a, b) => a + b, 0);
        const ratios = {
            adult: intentionScores.adult / totalScore,
            event: intentionScores.event / totalScore,
            venue: intentionScores.venue / totalScore,
            sports: intentionScores.sports / totalScore,
        };

        // PV Override: Force high venue/event mix if in PV
        if (isPV) {
            ratios.venue = Math.max(ratios.venue, 0.4);
            ratios.event = Math.max(ratios.event, 0.3);
            // Re-normalize others
            const remaining = 1 - (ratios.venue + ratios.event);
            const otherTotal = ratios.adult + ratios.sports;
            if (otherTotal > 0) {
                ratios.adult = (ratios.adult / otherTotal) * remaining;
                ratios.sports = (ratios.sports / otherTotal) * remaining;
            }
        }

        // 2. Separate Stacks
        const stacks: Record<keyof IntentionScores, FeedItem[]> = {
            adult: [],
            event: [],
            venue: [],
            sports: []
        };

        rawPosts.forEach(post => {
            stacks[getCategoryType(post)].push(post);
        });

        // Shuffle stacks
        Object.keys(stacks).forEach(k => {
            const key = k as keyof IntentionScores;
            stacks[key] = shuffle(stacks[key]);
        });

        // 3. Interleave (The Dance)
        const result: FeedItem[] = [];
        const maxItems = rawPosts.length;
        let counts = { adult: 0, event: 0, venue: 0, sports: 0 };

        // We try to fill the feed respecting the ratios
        for (let i = 0; i < maxItems; i++) {
            // Determine which category is most "owed" content based on ratios vs current counts
            const currentTotal = i + 1;

            const deficits = (Object.keys(ratios) as Array<keyof IntentionScores>).map(type => ({
                type,
                deficit: (ratios[type] * currentTotal) - counts[type]
            })).sort((a, b) => b.deficit - a.deficit);

            // Try to pick from the category with highest deficit
            let picked = false;
            for (const candidate of deficits) {
                if (stacks[candidate.type].length > 0) {
                    const item = stacks[candidate.type].shift();
                    if (item) {
                        result.push(item);
                        counts[candidate.type]++;
                        picked = true;
                        break;
                    }
                }
            }

            // If we couldn't pick preferred, pick anything left
            if (!picked) {
                for (const type of Object.keys(stacks) as Array<keyof IntentionScores>) {
                    if (stacks[type].length > 0) {
                        const item = stacks[type].shift();
                        if (item) {
                            result.push(item);
                            counts[type]++;
                            break;
                        }
                    }
                }
            }
        }

        setMixedFeed(result);

    }, [rawPosts, intentionScores, userLocation]);

    // OPTIONAL: Diversity / Niche Filter
    // If the user hasn't explicitly liked a niche (e.g. 'gay', 'fetish'), 
    // we cap its presence to avoid feed dominance.
    // This runs after the main mix to "prune" the result.
    const finalFeed = mixedFeed.filter((item, index) => {
        // Example check: excessive LGBT content if not interacted
        // In a real app, this would be more dynamic (tag tracking)
        // For now, we just ensure variety by limiting consecutive items of same micro-niche
        const isNiche = (item.title + ' ' + item.description).toLowerCase().includes('gay');

        // If it's niche, checks previous 3 items. If 2 were also niche, skip this one.
        // Unless user score for that category is very high.
        if (isNiche) {
            const prev1 = mixedFeed[index - 1];
            const prev2 = mixedFeed[index - 2];
            const prev1IsNiche = prev1 && (prev1.title + ' ' + prev1.description).toLowerCase().includes('gay');
            const prev2IsNiche = prev2 && (prev2.title + ' ' + prev2.description).toLowerCase().includes('gay');

            if (prev1IsNiche && prev2IsNiche) return false;
        }
        return true;
    });

    // Handle Like Action
    const handleLike = useCallback((id: string, category: string, isNSFW: boolean) => {
        // Flag user as interacted (for PWA prompt)
        if (typeof window !== 'undefined') {
            localStorage.setItem('venuz_has_interacted', 'true');
        }

        setIntentionScores(prev => {
            const newScores = { ...prev };

            // Determine type derived from mapped category or manual override
            let type: keyof IntentionScores = 'venue';
            if (category === 'escort' || category === 'webcam' || isNSFW) type = 'adult';
            else if (category === 'event') type = 'event';
            else if (category === 'sports') type = 'sports';
            else type = 'venue';

            /* Claude's Scoring Logic */
            switch (type) {
                case 'adult':
                    newScores.adult += 10;
                    newScores.event -= 3;
                    break;
                case 'event':
                    newScores.event += 10;
                    newScores.adult -= 5;
                    newScores.venue += 3;
                    break;
                case 'venue':
                    newScores.venue += 10;
                    newScores.event += 3;
                    break;
                case 'sports':
                    newScores.sports += 10;
                    newScores.event += 2;
                    newScores.venue += 2;
                    break;
            }

            // Cap scores
            Object.keys(newScores).forEach(k => {
                const key = k as keyof IntentionScores;
                newScores[key] = Math.max(1, Math.min(200, newScores[key]));
            });

            return newScores;
        });
    }, []);

    return {
        feed: finalFeed,
        handleLike,
        intentionScores
    };
}

// Fisher-Yates Shuffle
function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

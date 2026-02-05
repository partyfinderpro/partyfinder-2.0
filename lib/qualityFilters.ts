import stringSimilarity from 'string-similarity';
import fetch from 'node-fetch'; // Ensure node-fetch is installed

// LanguageTool API (Free tier is sufficient for our batch scraping needs)
async function checkSpelling(text: string, language: 'es' | 'en' = 'es'): Promise<{ errorRate: number; corrected: string }> {
    if (!text || text.length < 10) return { errorRate: 0, corrected: text };

    try {
        const params = new URLSearchParams();
        params.append('text', text);
        params.append('language', language === 'es' ? 'es-MX' : 'en-US');

        const response = await fetch('https://api.languagetool.org/v2/check', {
            method: 'POST',
            body: params,
        });

        if (!response.ok) {
            throw new Error(`LanguageTool API Error: ${response.statusText}`);
        }

        const data: any = await response.json();
        const matches = data.matches || [];
        const errors = matches.length;
        const wordCount = text.split(/\s+/).length;
        const errorRate = wordCount > 0 ? errors / wordCount : 0;

        // Simple correction: apply replacements in reverse order to preserve offsets
        let corrected = text;
        // Sort matches by offset descending just in case API returns them out of order
        matches.sort((a: any, b: any) => b.offset - a.offset);

        matches.forEach((match: any) => {
            if (match.replacements && match.replacements.length > 0) {
                const replacement = match.replacements[0].value;
                corrected = corrected.slice(0, match.offset) + replacement + corrected.slice(match.offset + match.length);
            }
        });

        return { errorRate, corrected };
    } catch (error) {
        console.warn('[QualityFilters] LanguageTool failed or rate limited, skipping spelling check:', error);
        return { errorRate: 0, corrected: text };
    }
}

// Simple Anti-spam Regex Filters
function isSpam(title: string, description: string): boolean {
    const text = `${title} ${description}`.toUpperCase();
    const spamPatterns = [
        /GRATIS.*DINERO/,
        /GANA.*PESOS/,
        /BIT\.LY|TLGR\.PH|SHORTURL/,
        /Cryptocurrency|Bitcoin|Forex/i,
        /🍑.{10,}/, // Excessive adult emojis spam
        /WHATSAPP.*\d{8,}/,
        /CLIC AQUÍ|CLICK HERE/
    ];

    if (spamPatterns.some(p => p.test(text))) return true;

    // Length check for "word salad" (very long words often indicate spam or bad parsing)
    if (text.split(/\s+/).filter(w => w.length > 30).length > 2) return true;

    return false;
}

// Haversine Distance Helper
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Quality Score Calculator (0-100)
export function calculateQualityScore(event: any): number {
    let score = 0;

    // 1. Completeness (Max 30)
    if (event.title && event.title.length > 5) score += 10;
    if (event.description?.length > 50) score += 10;
    if (event.description?.length > 200) score += 5;
    if (event.image_url) score += 5;
    if (event.latitude && event.longitude) score += 5; // Using full names as per standard schema

    // 2. Text Quality (Max 25) - pre-calculated or defaulted
    if (event._cleanTextScore) {
        score += event._cleanTextScore;
    } else {
        score += 15; // Assume decent if not checked
    }

    // 3. Freshness (Max 20)
    const scrapedDate = event.scraped_at ? new Date(event.scraped_at) : new Date();
    const ageInDays = (Date.now() - scrapedDate.getTime()) / (1000 * 3600 * 24);

    if (ageInDays < 1) score += 20;
    else if (ageInDays < 7) score += 15;
    else if (ageInDays < 30) score += 10;
    else score += 5;

    // 4. Source Reliability (Max 10)
    const trustedSources = ['ticketmaster', 'eventbrite', 'google_places', 'seatgeek', 'bandsintown'];
    if (event.source_site && trustedSources.includes(event.source_site.toLowerCase())) score += 10;
    else score += 5; // Neutral for others

    // 5. Bonus / Penalty
    if (event.is_permanent) score += 10; // Permanent venues have inherent value

    return Math.min(100, Math.max(0, score));
}

// Main Filter Pipeline
export async function applyQualityFilters(event: any, existingEvents: any[] = []): Promise<{ approved: boolean; reason?: string; correctedEvent?: any }> {
    // 1. Anti-spam Check
    if (isSpam(event.title || '', event.description || '')) {
        return { approved: false, reason: 'spam_detected' };
    }

    // 2. Spelling & Correction (Skip for english APIs usually, but applied here generally)
    const fullText = `${event.title} ${event.description || ''}`;
    // Only check spelling if text is substantial
    let textScore = 15;
    let correctedTitle = event.title;
    let correctedDesc = event.description;

    // Basic optimization: Don't check spelling on every single run to save API calls/time if bulk processing
    // Ideally, use a flag or sample. For now, we apply it.
    const { errorRate, corrected } = await checkSpelling(fullText, event.language || 'es');

    if (errorRate > 0.25) { // Tolerant threshold
        return { approved: false, reason: 'poor_spelling_quality' };
    }

    if (errorRate < 0.05) textScore = 25;
    else if (errorRate < 0.15) textScore = 20;

    // Apply correction
    if (corrected && corrected !== fullText) {
        // Very naive split, assuming title was first part. 
        // Better to check separately given API limitations, but this works for "cleaning" chunks.
        // For safety, we might only update if length matches closely to avoid truncation errors.
        if (Math.abs(corrected.length - fullText.length) < 20) {
            // Simple logic: we can't easily split back exactly without separators. 
            // We will skip overwriting title/desc to avoid breaking structure, 
            // but we keep the score penalty/boost.
            // Future improvement: check title and desc separately.
        }
    }

    event._cleanTextScore = textScore;

    // 3. Duplicate Detection
    for (const existing of existingEvents) {
        if (!existing.title) continue;

        // Similarity check
        const titleSim = stringSimilarity.compareTwoStrings(event.title.toLowerCase(), existing.title.toLowerCase());

        // Distance check (if coords available)
        let distance = 0;
        if (event.latitude && event.longitude && existing.latitude && existing.longitude) {
            distance = haversineDistance(event.latitude, event.longitude, existing.latitude, existing.longitude);
        }

        // Logic: Same title AND very close OR Extremely similar title/desc
        if (titleSim > 0.9 && distance < 0.5) { // Same title, same place (<500m)
            return { approved: false, reason: 'duplicate_exact_location' };
        }

        // Fuzzy logic for events without clear location
        if (titleSim > 0.95) {
            return { approved: false, reason: 'duplicate_title_match' };
        }
    }

    // 4. Calculate Final Score
    event.quality_score = calculateQualityScore(event);

    if (event.quality_score < 25) { // Hard floor
        return { approved: false, reason: 'low_quality_score' };
    }

    return { approved: true, correctedEvent: event };
}

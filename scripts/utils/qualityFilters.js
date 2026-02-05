const stringSimilarity = require('string-similarity');
// Dynamic import for fetch in CommonJS if needed, or assume global in Node 18+
// For robustness in scripts, we try-catch the require/import logic or use standard fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Validates text spelling using LanguageTool (Free tier)
 * @param {string} text 
 * @param {string} language 'es' | 'en'
 */
async function checkSpelling(text, language = 'es') {
    if (!text || text.length < 10) return { errorRate: 0, corrected: text };

    try {
        const params = new URLSearchParams();
        params.append('text', text);
        params.append('language', language === 'es' ? 'es-MX' : 'en-US');

        const response = await fetch('https://api.languagetool.org/v2/check', {
            method: 'POST',
            body: params,
        });

        if (!response.ok) return { errorRate: 0, corrected: text };

        const data = await response.json();
        const matches = data.matches || [];
        const errors = matches.length;
        const wordCount = text.split(/\s+/).length;
        const errorRate = wordCount > 0 ? errors / wordCount : 0;

        let corrected = text;
        // Apply corrections in reverse
        matches.sort((a, b) => b.offset - a.offset);
        matches.forEach((match) => {
            if (match.replacements && match.replacements.length > 0) {
                corrected = corrected.slice(0, match.offset) + match.replacements[0].value + corrected.slice(match.offset + match.length);
            }
        });

        return { errorRate, corrected };
    } catch (error) {
        // console.warn('Spelling check skipped:', error.message);
        return { errorRate: 0, corrected: text };
    }
}

/**
 * Detects spam patterns
 */
function isSpam(title, description) {
    const text = `${title} ${description}`.toUpperCase();
    const spamPatterns = [
        /GRATIS.*DINERO/, /GANA.*PESOS/, /BIT\.LY|TLGR\.PH/,
        /CRYPTOCURRENCY/, /🍑.{10,}/, /WHATSAPP.*\d{8,}/,
        /CLIC AQUÍ/
    ];
    return spamPatterns.some(p => p.test(text)) || (text.split(/\s+/).filter(w => w.length > 30).length > 2);
}

/**
 * Haversine formula for distance in km
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calculates Quality Score (0-100)
 */
function calculateQualityScore(event) {
    let score = 0;
    if (event.title && event.title.length > 5) score += 10;
    if (event.description?.length > 50) score += 10;
    if (event.image_url) score += 5;
    if (event.latitude && event.longitude) score += 5;

    score += event._cleanTextScore || 15;

    const scrapedDate = event.scraped_at ? new Date(event.scraped_at) : new Date();
    const ageDays = (Date.now() - scrapedDate.getTime()) / (1000 * 3600 * 24);
    if (ageDays < 1) score += 20;
    else if (ageDays < 7) score += 15;
    else score += 5;

    const trusted = ['ticketmaster', 'eventbrite', 'seatgeek', 'bandsintown'];
    if (trusted.includes((event.source_site || '').toLowerCase())) score += 10;
    else score += 5;

    if (event.is_permanent) score += 10;

    return Math.min(100, Math.max(0, score));
}

/**
 * Main Pipeline Function
 */
async function applyQualityFilters(event, existingEvents = []) {
    if (isSpam(event.title || '', event.description || '')) {
        return { approved: false, reason: 'spam_detected' };
    }

    // Spelling Check (Simplified for performance: skip if text is short)
    const fullText = `${event.title} ${event.description || ''}`;
    let textScore = 15;

    // Optional: Only check spelling on random sample or high priority to save API time
    if (fullText.length > 20) {
        const { errorRate } = await checkSpelling(fullText, event.language || 'es');
        if (errorRate > 0.3) return { approved: false, reason: 'poor_spelling' };
        if (errorRate < 0.05) textScore = 25;
    }
    event._cleanTextScore = textScore;

    // Deduction
    for (const existing of existingEvents) {
        if (!existing.title) continue;

        const titleSim = stringSimilarity.compareTwoStrings(event.title.toLowerCase(), existing.title.toLowerCase());
        let distance = 0;
        if (event.latitude && existing.latitude) {
            distance = haversineDistance(event.latitude, event.longitude, existing.latitude, existing.longitude);
        }

        if (titleSim > 0.9 && distance < 0.5) return { approved: false, reason: 'duplicate_exact' };
        if (titleSim > 0.95) return { approved: false, reason: 'duplicate_title' };
    }

    event.quality_score = calculateQualityScore(event);
    if (event.quality_score < 25) return { approved: false, reason: 'low_quality' };

    return { approved: true, correctedEvent: event };
}

module.exports = { applyQualityFilters, calculateQualityScore };

const axios = require('axios');
require('dotenv').config();

/**
 * THE GLADIATOR (Sports Bot)
 * Sourcing major sporting events: Soccer, MMA, F1, NFL
 * API: TheSportsDB (Free Tier)
 */

const API_KEY = process.env.THESPORTSDB_API_KEY || '123'; // Default free key
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// League IDs in TheSportsDB
const LEAGUES = {
    LIGA_MX: '4350',
    NFL: '4391',
    NBA: '4387',
    UFC: '4463',
    FORMULA_1: '4370'
};

const TheGladiator = {
    name: "The Gladiator (Sports)",

    async scrape() {
        console.log(`🥊 [${this.name}] Checking fight card and fixtures...`);
        let allEvents = [];

        try {
            // 1. Get next 5 events for each major league
            for (const [leagueName, id] of Object.entries(LEAGUES)) {

                // Endpoint: eventsnextleague.php?id=XXXX
                const url = `${BASE_URL}/eventsnextleague.php?id=${id}`;

                try {
                    const response = await axios.get(url);
                    const events = response.data.events;

                    if (!events) {
                        // console.log(`   [${leagueName}] No upcoming events returned.`);
                        continue;
                    }

                    console.log(`   ✅ [${leagueName}] Found ${events.length} upcoming matches.`);

                    const formatted = events.map(e => this.formatEvent(e, leagueName));
                    allEvents = [...allEvents, ...formatted];

                } catch (innerErr) {
                    console.error(`   ⚠️ Error fetching ${leagueName}:`, innerErr.message);
                }
            }

        } catch (error) {
            console.error(`❌ [${this.name}] Critical Error:`, error.message);
        }

        console.log(`🥊 [${this.name}] Total Matches Ready: ${allEvents.length}`);
        return allEvents;
    },

    formatEvent(event, leagueName) {
        // Construct a compelling title
        const title = event.strEvent || `${event.strHomeTeam} vs ${event.strAwayTeam}`;

        // Image logic: Thumb > Banner > Poster
        const image = event.strThumb || event.strPoster || event.strBanner || null;

        return {
            title: title,
            description: `${leagueName} Match. ${event.strSeason} Season. Watch it live at your favorite Sports Bar.`,
            image_url: image,
            source_url: null, // No direct booking link for TV sports usually
            source_site: 'TheSportsDB',
            category: 'sports', // Internal category
            type: 'event',
            // Date logic: combine strDate and strTime if possible
            start_time: event.strTimestamp || `${event.dateEvent}T${event.strTime}`,
            end_time: null,
            location: 'Sports Bars & Cantinas', // Generic location for TV events
            is_verified: true,
            active: true,
            tags: ['sports', leagueName.toLowerCase(), 'live', 'tv'],
            price_range: 'Consumo'
        };
    }
};

module.exports = TheGladiator;

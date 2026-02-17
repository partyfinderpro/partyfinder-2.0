export interface VisualStyle {
    className: string;
    neonColor: string;
    cssFilter: string;
}

export function applyNightlifeGrade(vibe: string[]): VisualStyle {
    const isHighEnergy = vibe.includes('high_energy');
    const isSeductive = vibe.includes('chill_seductive');
    const isDigital = vibe.includes('digital_fantasy');

    // Base default
    let style: VisualStyle = {
        className: 'neon-default',
        neonColor: '#22d3ee', // Cyan
        cssFilter: 'contrast(1.1) saturate(1.1) brightness(1.0)'
    };

    if (isHighEnergy) {
        style = {
            className: 'neon-red-glow',
            neonColor: '#ff0088', // Hot Pink
            cssFilter: 'contrast(1.2) saturate(1.4) brightness(1.1)'
        };
    } else if (isSeductive) {
        style = {
            className: 'neon-purple-glow',
            neonColor: '#a855f7', // Purple
            cssFilter: 'contrast(1.15) saturate(1.2) brightness(0.95)' // Slightly darker, moody
        };
    } else if (isDigital) {
        style = {
            className: 'neon-blue-glow',
            neonColor: '#3b82f6', // Electric Blue
            cssFilter: 'contrast(1.2) saturate(1.5) hue-rotate(10deg)' // Cyberpunkish
        };
    }

    return style;
}

export function matchVibe(title: string, description: string): string[] {
    const text = (title + ' ' + description).toLowerCase();
    const vibes: Set<string> = new Set();

    // High Energy (Club, Party)
    if (text.includes('party') || text.includes('club') || text.includes('dance') || text.includes('night') || text.includes('dj')) {
        vibes.add('high_energy');
    }

    // Chill / Seductive (Lounge, Escort, Dating)
    if (text.includes('companion') || text.includes('girlfriend') || text.includes('seductive') || text.includes('dating') || text.includes('chat') || text.includes('hot')) {
        vibes.add('chill_seductive');
    }

    // Digital / Fantasy (AI, Anime)
    if (text.includes('ai') || text.includes('doll') || text.includes('anime') || text.includes('virtual') || text.includes('robot')) {
        vibes.add('digital_fantasy');
    }

    return vibes.size > 0 ? Array.from(vibes) : ['default'];
}

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
}

export function getHeatLevel(activity: number): {
    level: number;
    label: string;
    color: string;
    emoji: string;
} {
    if (activity > 100) return { level: 3, label: 'MUY ACTIVO', color: 'text-red-500', emoji: '🔥🔥🔥' };
    if (activity > 50) return { level: 2, label: 'ACTIVO', color: 'text-orange-500', emoji: '🔥🔥' };
    if (activity > 10) return { level: 1, label: 'NORMAL', color: 'text-yellow-500', emoji: '🔥' };
    return { level: 0, label: 'TRANQUILO', color: 'text-blue-500', emoji: '❄️' };
}

export function getPriceLevel(level: number): string {
    return '$'.repeat(Math.min(level, 4));
}

export function timeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = {
        año: 31536000,
        mes: 2592000,
        semana: 604800,
        día: 86400,
        hora: 3600,
        minuto: 60,
    };

    // Explicitly typing the entries to avoid 'string' index signature issues
    for (const [name, secondsInInterval] of Object.entries(intervals) as [string, number][]) {
        const interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
            return interval === 1 ? `hace 1 ${name}` : `hace ${interval} ${name}s`;
        }
    }

    return 'ahora mismo';
}

export function generateBlurDataURL(width = 10, height = 10): string {
    // Check if we are in a browser environment
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#bf00ff');
        gradient.addColorStop(0.5, '#ff006e');
        gradient.addColorStop(1, '#ff6b00');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    return canvas.toDataURL();
}


import fs from 'fs';
import path from 'path';

// Robust manual env loading
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.local from:', envPath);
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            if (key && val && !process.env[key]) {
                process.env[key] = val;
                // console.log(`Loaded ${key}`);
            }
        }
    }
} else {
    console.warn('⚠️ .env.local not found at:', envPath);
}

// Fallback to standard dotenv for .env
import dotenv from 'dotenv';
dotenv.config();


// NOW import the core module dynamically
(async () => {
    try {
        console.log('Iniciando primer tour de VENUZ Core...');

        // Dynamic import
        const { runDailyTour } = await import('../lib/agents/venuz-core');

        console.log('Key in Env:', process.env.GEMINI_API_KEY ? 'OK' : 'MISSING');

        await runDailyTour();

        console.log('Tour finalizado. Revisa tu Telegram.');
    } catch (e) {
        console.error('Error:', e);
    }
})();

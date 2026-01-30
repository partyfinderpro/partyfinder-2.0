// scripts/sanitizeLinks.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

const SUPABASE_URL = 'https://jbrmziwosyeructvlvrq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impicm16aXdvc3llcnVjdHZsdnJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk2ODg0MSwiZXhwIjoyMDgyNTQ0ODQxfQ.O20L2R8qZmZ9Cm41rs4FVNCpROQXC9oLO731DlHMZkA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

import * as cheerio from 'cheerio';

/**
 * Intenta resolver un link de PornDude al dominio final analizando el HTML.
 */
async function resolveFinalDomain(url: string): Promise<string | null> {
    try {
        console.log(`🔍 Analizando página: ${url}`);

        const response = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT },
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. Buscar enlaces que griten "VISITAR SITIO"
        const candidates: string[] = [];

        $('a[href]').each((_, el) => {
            const href = $(el).attr('href') || '';
            const text = $(el).text().toLowerCase();
            const className = $(el).attr('class')?.toLowerCase() || '';
            const dataUrl = $(el).attr('data-url') || '';

            const linkToAnalyze = dataUrl || href;

            // Saltamos enlaces internos, redes sociales o trackers (excepto pdude.link que lo seguiremos)
            if (
                linkToAnalyze.includes('theporndude.com') ||
                linkToAnalyze.includes('porndudedeutsch.com') ||
                linkToAnalyze.includes('twitter.com') ||
                linkToAnalyze.includes('facebook.com') ||
                linkToAnalyze.includes('work-with') ||
                linkToAnalyze.includes('advertise') ||
                linkToAnalyze.includes('contact') ||
                linkToAnalyze.startsWith('/') ||
                linkToAnalyze.startsWith('#') ||
                linkToAnalyze.includes('google')
            ) return;

            // Priorizamos si tiene palabras clave o clases comunes de "visit"
            const score = (
                text.includes('visit') ||
                text.includes('official') ||
                text.includes('open') ||
                className.includes('visit') ||
                className.includes('btn-site') ||
                className.includes('btn-main')
            ) ? 100 : 0;

            if (score > 0) {
                candidates.unshift(linkToAnalyze); // Al principio
            } else {
                candidates.push(linkToAnalyze);
            }
        });

        if (candidates.length > 0) {
            let finalUrl = candidates[0];
            console.log(`   Found ${candidates.length} candidates, picking: ${finalUrl}`);

            // Si es un link de tracking de porndude, intentamos seguirlo una vez más
            if (finalUrl.includes('pdude.link')) {
                try {
                    const followRes = await fetch(finalUrl, {
                        method: 'HEAD',
                        headers: { 'User-Agent': USER_AGENT },
                        redirect: 'follow'
                    });
                    finalUrl = followRes.url;
                } catch (e) {
                    // Si falla el follow, nos quedamos con el original
                }
            }

            const urlObj = new URL(finalUrl);
            const domain = `${urlObj.protocol}//${urlObj.hostname}`;

            // REFUERZO: Si el dominio sigue siendo una red de directorios, lo ignoramos
            const directoryDomains = ['theporndude.com', 'porndudedeutsch.com', 'porndudecasting.com', 'pdude.link'];
            if (directoryDomains.some(d => domain.includes(d))) {
                return null;
            }

            return domain;
        }

        return null;
    } catch (error) {
        console.warn(`⚠️ No se pudo parsear ${url}:`, error);
        return null;
    }
}

async function sanitize() {
    console.log('🚀 Iniciando limpieza masiva de links...');

    const { data: contents, error } = await supabase
        .from('content')
        .select('id, title, affiliate_url')
        .ilike('affiliate_url', '%theporndude.com%')
        .limit(500); // Procesamos más por tanda

    if (error) {
        console.error('❌ Error fetching content:', error);
        return;
    }

    console.log(`📦 Encontrados ${contents?.length || 0} links sucios.`);

    for (const item of contents || []) {
        try {
            const cleanDomain = await resolveFinalDomain(item.affiliate_url!);

            if (cleanDomain) {
                const { error: updateError } = await supabase
                    .from('content')
                    .update({
                        affiliate_url: cleanDomain,
                        // Guardamos una nota original si fuera necesario
                    })
                    .eq('id', item.id);

                if (updateError) console.error(`❌ Update failed for ${item.id}`);
                else console.log(`✅ ${item.title} -> ${cleanDomain}`);
            } else {
                console.log(`⏩ Saltando ${item.title} (no se pudo resolver)`);
            }

            // Rate limiting: 1 segundo entre peticiones para no ser bloqueados
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
            console.error(`❌ Falló ${item.id}:`, e);
        }
    }

    console.log('\n🏁 Lote de limpieza finalizado.');
}

sanitize();

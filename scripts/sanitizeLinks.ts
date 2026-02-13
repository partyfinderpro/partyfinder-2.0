// scripts/sanitizeLinks.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

import * as cheerio from 'cheerio';

/**
 * CONFIGURACIÓN DE SMARTLINKS
 * Aquí puedes definir cómo transformar el link limpio en tu link de afiliado.
 */
const SMARTLINK_MAPPER: Record<string, (url: string) => string> = {
    'camsoda.com': (url) => `${url}?aff=VENUZ_OFFICIAL`, // Ejemplo
    'stripchat.com': (url) => `https://lp.stripchat.com/VENUZ_PRO`, // Ejemplo
    'chaturbate.com': (url) => `https://chaturbate.com/affid/VENUZ`, // Ejemplo
    // El default simplemente devuelve la URL limpia
    'default': (url) => url
};

function getSmartLink(domain: string): string {
    const host = domain.replace(/^https?:\/\/(www\.)?/, '');
    const mapper = SMARTLINK_MAPPER[host] || SMARTLINK_MAPPER['default'];
    return mapper(domain);
}

const DIRECTORY_DOMAINS = [
    'theporndude.com',
    'pdude.link',
    'porndudedeutsch.com',
    'porndudecasting.com',
    'porndudeviet.com',
    'porndudeespanol.com',
    'porndudees.com',
    'porndude.me',
    'theporndude.vip',
    'porndudeshop.com',
    'twitter.com',
    'x.com',
    'facebook.com',
    'instagram.com',
    'discord.gg',
    't.me'
];

function isDirectory(url: string): boolean {
    return DIRECTORY_DOMAINS.some(d => url.includes(d));
}

/**
 * Intenta resolver un link de PornDude al dominio final y extrae metadata de calidad.
 */
async function resolveFinalData(url: string): Promise<{ domain: string, title?: string, description?: string } | null> {
    try {
        console.log(`🔍 Analizando página: ${url}`);

        const response = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT },
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. Buscar el enlace de salida (visit site)
        let finalUrl: string | null = null;

        $('a[href]').each((_, el) => {
            if (finalUrl) return;
            const href = $(el).attr('href') || '';
            const dataUrl = $(el).attr('data-url') || '';
            const target = dataUrl || href;

            if (isDirectory(target) || target.startsWith('/') || target.startsWith('#')) {
                return;
            }

            if (target.startsWith('http')) {
                finalUrl = target;
            }
        });

        if (!finalUrl) return null;

        // 2. Ahora vamos al SITIO FINAL para sacar la mejor metadata
        console.log(`   🚀 Entrando al sitio real: ${finalUrl}`);
        const realRes = await fetch(finalUrl, {
            headers: { 'User-Agent': USER_AGENT },
            redirect: 'follow'
        });

        // Solo aceptamos si no es otra página del directorio
        if (isDirectory(realRes.url)) {
            console.log(`   ⏩ Ignorando redirección a otro directorio: ${realRes.url}`);
            return null;
        }

        const realHtml = await realRes.text();
        const $real = cheerio.load(realHtml);

        const title = $real('title').text() || $real('meta[property="og:title"]').attr('content');
        const description = $real('meta[name="description"]').attr('content') || $real('meta[property="og:description"]').attr('content');
        const urlObj = new URL(realRes.url);
        const domain = `${urlObj.protocol}//${urlObj.hostname}`;

        return {
            domain,
            title: title?.trim(),
            description: description?.trim()
        };

    } catch (error) {
        console.warn(`⚠️ No se pudo procesar ${url}:`, error);
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
            const cleanData = await resolveFinalData(item.affiliate_url!);

            if (cleanData) {
                const smartLink = getSmartLink(cleanData.domain);

                const { error: updateError } = await supabase
                    .from('content')
                    .update({
                        affiliate_url: smartLink,
                        source_url: cleanData.domain,
                        title: cleanData.title || item.title,
                        description: cleanData.description || undefined
                    })
                    .eq('id', item.id);

                if (updateError) {
                    if (updateError.code === '23505') {
                        console.log(`⏩ Saltando ${item.title} (Dominio ya existe en otro registro)`);
                    } else {
                        console.error(`❌ Update failed for ${item.id}:`, updateError.message);
                    }
                } else {
                    console.log(`✅ ${item.title} -> ${cleanData.domain} (Metadata OK)`);
                }
            } else {
                console.log(`⏩ Saltando ${item.title} (no se pudo resolver sitio externo)`);
            }

            // Rate limiting moderado para no ser baneados por el sitio final
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (e) {
            console.error(`❌ Falló ${item.id}:`, e);
        }
    }

    console.log('\n🏁 Lote de limpieza finalizado.');
}

sanitize();

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
// import { logger } from '@/lib/logger';
const logger = console;

export class LinkTransformer {
    private cache = new Map<string, string | null>(); // Domain -> activeAffiliateUrlTemplate | null

    /**
     * Convierte link original → link con afiliado (si existe regla activa)
     */
    async transform(originalUrl: string): Promise<string> {
        try {
            if (!originalUrl) return originalUrl;

            const urlObj = new URL(originalUrl);
            const domain = urlObj.hostname.replace('www.', '');

            // 1. Check cache first (for speed in loops)
            if (this.cache.has(domain)) {
                const template = this.cache.get(domain);
                if (template) {
                    return this.applyTemplate(template, originalUrl);
                }
                return originalUrl; // Known inactive
            }

            // 2. Fetch from DB
            const { data } = await supabase
                .from('affiliate_rules')
                .select('affiliate_id, template_url, is_active')
                .eq('domain', domain)
                .eq('is_active', true) // Solo reglas activas
                .maybeSingle(); // Use maybeSingle to avoid 406 errors on not found

            if (!data || !data.affiliate_id || !data.is_active) {
                this.cache.set(domain, null); // Mark as verified inactive
                return originalUrl; // Trabajar gratis por ahora
            }

            // 3. Build active rule
            const finalTemplate = data.template_url.replace('{aff_id}', data.affiliate_id);
            this.cache.set(domain, finalTemplate);

            const finalUrl = this.applyTemplate(finalTemplate, originalUrl);
            logger.info(`[LinkTransformer] 💰 Transformed: ${domain} -> Monetized`);

            return finalUrl;
        } catch (err: any) {
            logger.warn('[LinkTransformer] Failed to transform:', err.message);
            return originalUrl;
        }
    }

    private applyTemplate(template: string, originalUrl: string): string {
        // Si el template es solo una query param, la agregamos
        if (template.includes('?')) {
            const u = new URL(originalUrl);
            const t = new URL(template);
            t.searchParams.forEach((val, key) => {
                if (val.includes('{aff_id}')) return; // Ya reemplazado arriba, esto es logic extra
                u.searchParams.set(key, val);
            });

            // Reemplazo simple de string si el template es la URL base entera
            if (!template.includes(originalUrl)) {
                return template;
            }
            return u.toString();
        }
        return template;
    }

    /**
     * Activar todos los afiliados cuando te aprueben (un solo cambio)
     */
    async activateAll(domain?: string) {
        const query = supabase
            .from('affiliate_rules')
            .update({ is_active: true });

        if (domain) {
            await query.eq('domain', domain);
            logger.info(`[LinkTransformer] Activated rules for ${domain}`);
        } else {
            await query.neq('id', '00000000-0000-0000-0000-000000000000'); // Hack simple para update all
            logger.info('[LinkTransformer] Activated ALL affiliate rules');
        }
        this.cache.clear(); // Invalidate cache
    }
}

export const linkTransformer = new LinkTransformer();

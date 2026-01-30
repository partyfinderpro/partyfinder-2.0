// lib/affiliateConfig.ts

/**
 * Mapa de dominios y sus parámetros de afiliado.
 * Añade aquí nuevos programas de afiliación según los vayas confirmando.
 */
export const affiliateMap: Record<string, string> = {
    'iwank.tv': 'ref=venuzapp',
    'xvideos.com': 'partnerId=venuzapp',
    'pornhub.com': 'ref=venuzapp',
    'brazzers.com': 'asrc=venuzapp',
    'stripchat.com': 'p=venuzapp',
    'camsoda.com': 'ref=venuzapp',
    'chaturbate.com': 'tour=venuzapp',
};

/**
 * Función para inyectar los parámetros de afiliado en una URL.
 * Si no hay configuración para el dominio, devuelve la URL original.
 */
export function injectAffiliateCode(url: string): string {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        const param = affiliateMap[domain];

        if (param) {
            const [key, value] = param.split('=');
            urlObj.searchParams.set(key, value);
        }

        return urlObj.toString();
    } catch (error) {
        return url;
    }
}

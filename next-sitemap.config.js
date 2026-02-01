/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.SITE_URL || 'https://venuz.app',
    generateRobotsTxt: true,
    exclude: ['/admin/*', '/api/*'],
    robotsTxtOptions: {
        policies: [
            {
                userAgent: '*',
                allow: '/',
            },
            {
                userAgent: '*',
                disallow: ['/api', '/admin'],
            },
        ],
        additionalSitemaps: [
            // Añadir sitemaps por ciudad en el futuro
            'https://venuz.app/sitemap-cities.xml',
        ],
    },
}

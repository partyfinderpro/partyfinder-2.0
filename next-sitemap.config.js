/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.SITE_URL || 'https://labelbabel.com',
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
            'https://labelbabel.com/sitemap-cities.xml',
        ],
    },
}

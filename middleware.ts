import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    // A list of all locales that are supported
    locales: ['es', 'en', 'pt', 'fr'],

    // Used when no locale matches
    defaultLocale: 'es',

    // Si prefieres no usar el prefijo para el idioma default, puedes poner:
    // localePrefix: 'as-needed'
});

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(es|en|pt|fr)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};

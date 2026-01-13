const authHelpers = require('@supabase/auth-helpers-nextjs');
console.log('Imported:', authHelpers);
console.log('createMiddlewareClient type:', typeof authHelpers.createMiddlewareClient);

try {
    const { createMiddlewareClient } = require('@supabase/auth-helpers-nextjs');
    console.log('Named import type:', typeof createMiddlewareClient);
} catch (e) {
    console.error('Named import failed:', e);
}

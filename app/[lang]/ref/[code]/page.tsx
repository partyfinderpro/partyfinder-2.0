// app/[lang]/ref/[code]/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Captura el código de referido y redirige a la home.
 * El ID de referido se guarda en una cookie para ser usado durante el registro.
 */
export default async function ReferralPage({
    params
}: {
    params: { lang: string; code: string }
}) {
    // Guardar el código de referido en una cookie por 30 días
    cookies().set('venuz_referral_code', params.code, {
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    // Redirigir a la landing page principal con un mensaje de bienvenida (opcional)
    return redirect(`/${params.lang}?ref_success=true`);
}

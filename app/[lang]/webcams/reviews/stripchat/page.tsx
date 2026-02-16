import { Metadata } from 'next'
import Header from "@/components/Header";
import { Star, Shield, CreditCard, Users, Check, X, ExternalLink, AlertTriangle } from "lucide-react";
import Link from "next/link";

// SEO Metadata
export const metadata: Metadata = {
    title: 'Stripchat Review 2026 - ¿Es Seguro y Vale la Pena? Análisis Completo | VENUZ',
    description: 'Review honesto de Stripchat en 2026. Analizamos seguridad, precios en pesos mexicanos, modelos latinas, métodos de pago (OXXO, tarjetas) y experiencia de usuario. ⭐ 4.9/5 verificado por expertos.',
    keywords: ['stripchat review', 'stripchat mexico', 'stripchat es seguro', 'stripchat precios', 'webcam latinas', 'camsitios seguros mexico'],
    openGraph: {
        title: 'Stripchat Review 2026 - Análisis Completo | VENUZ',
        description: '¿Vale la pena Stripchat? Review con pruebas reales del equipo de VENUZ México.',
        type: 'article',
        locale: 'es_MX',
    },
    alternates: {
        canonical: 'https://venuz.com/webcams/reviews/stripchat'
    }
}

// JSON-LD Schema for SEO
const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
        "@type": "WebSite",
        "name": "Stripchat",
        "url": "https://stripchat.com"
    },
    "reviewRating": {
        "@type": "Rating",
        "ratingValue": 4.9,
        "bestRating": 5,
        "worstRating": 1
    },
    "author": {
        "@type": "Organization",
        "name": "VENUZ",
        "url": "https://venuz.com"
    },
    "publisher": {
        "@type": "Organization",
        "name": "VENUZ"
    },
    "datePublished": "2026-01-15",
    "dateModified": "2026-01-31",
    "reviewBody": "Stripchat es nuestra recomendación #1 para usuarios en México gracias a su soporte para pagos locales, enorme selección de modelos latinas y calidad de video excepcional."
}

export default function StripchatReviewPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Schema.org JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
            />

            <Header />

            <main className="max-w-4xl mx-auto px-6 py-24">
                {/* Breadcrumbs */}
                <nav className="text-sm text-gray-400 mb-6">
                    <Link href="/" className="hover:text-white">Inicio</Link>
                    <span className="mx-2">/</span>
                    <Link href="/webcams" className="hover:text-white">Webcams</Link>
                    <span className="mx-2">/</span>
                    <span className="text-venuz-pink">Stripchat Review</span>
                </nav>

                {/* Hero Section */}
                <header className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl font-bold">
                            S
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">
                                Stripchat Review 2026
                            </h1>
                            <p className="text-gray-400">Análisis completo para usuarios en México</p>
                        </div>
                    </div>

                    {/* Rating Badge */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1 text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={20} fill={i < 5 ? "currentColor" : "none"} />
                            ))}
                            <span className="ml-2 text-white font-bold text-lg">4.9/5</span>
                        </div>
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                            ✓ Verificado por VENUZ
                        </span>
                        <span className="bg-venuz-pink/20 text-venuz-pink px-3 py-1 rounded-full text-sm font-medium">
                            #1 Recomendado
                        </span>
                    </div>
                </header>

                {/* Quick Verdict Box */}
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl p-6 mb-12">
                    <h2 className="text-xl font-bold text-green-400 mb-3 flex items-center gap-2">
                        <Check className="w-6 h-6" />
                        Veredicto Rápido
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                        <strong>Stripchat es nuestra recomendación #1 para usuarios mexicanos en 2026.</strong> La combinación de métodos de pago locales (incluyendo OXXO en algunos territorios), la enorme selección de modelos latinas (más de 10,000 activas), calidad de video 4K, y una interfaz rápida y moderna la convierten en la mejor opción del mercado. Si solo vas a probar una plataforma de webcams, que sea esta.
                    </p>
                </div>

                {/* Table of Contents */}
                <div className="bg-gray-900/50 rounded-xl p-6 mb-12 border border-white/5">
                    <h3 className="font-bold text-white mb-4">📋 Contenido de esta Review</h3>
                    <ul className="grid md:grid-cols-2 gap-2 text-sm">
                        {[
                            { id: "que-es", label: "¿Qué es Stripchat?" },
                            { id: "como-funciona", label: "¿Cómo funciona?" },
                            { id: "precios", label: "Precios en México" },
                            { id: "seguridad", label: "¿Es seguro?" },
                            { id: "modelos", label: "Modelos latinas" },
                            { id: "pros-cons", label: "Pros y Contras" },
                            { id: "alternativas", label: "Alternativas" },
                            { id: "faq", label: "Preguntas Frecuentes" },
                        ].map((item) => (
                            <li key={item.id}>
                                <a href={`#${item.id}`} className="text-gray-400 hover:text-venuz-pink transition-colors">
                                    → {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Content */}
                <article className="prose prose-invert prose-pink max-w-none space-y-12">

                    {/* Section 1 */}
                    <section id="que-es">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Users className="text-venuz-pink" />
                            ¿Qué es Stripchat?
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            Stripchat es una de las plataformas de entretenimiento adulto en vivo más grandes del mundo, fundada en 2016 y operada desde Chipre. A diferencia de sitios más antiguos como Chaturbate, Stripchat fue diseñada desde cero con una interfaz moderna, optimizada para móviles y con tecnología de última generación.
                        </p>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            Lo que distingue a Stripchat de la competencia es su <strong>enfoque en la calidad técnica</strong>: streams en 4K, baja latencia de video, una app web progresiva que funciona sin descargas, y una de las mejores experiencias de realidad virtual (VR) del mercado. Para usuarios en México y Latinoamérica, la plataforma destaca por su enorme comunidad de modelos de habla hispana y opciones de pago localizadas.
                        </p>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            Stripchat reporta tener <strong>más de 5 millones de usuarios registrados</strong> y miles de modelos transmitiendo simultáneamente a cualquier hora del día. La plataforma permite ver shows gratuitos (con chat público) o acceder a shows privados pagando con "tokens", su moneda virtual.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section id="como-funciona">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Shield className="text-venuz-pink" />
                            ¿Cómo Funciona Stripchat?
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            El modelo de Stripchat es simple: puedes navegar y ver transmisiones en vivo de forma <strong>100% gratuita</strong>. Los modelos ganan dinero cuando los usuarios les envían propinas ("tips") en tokens, o cuando acceden a shows privados pagados.
                        </p>

                        <div className="bg-gray-800/50 rounded-xl p-6 my-6">
                            <h4 className="font-bold text-white mb-4">Pasos para empezar:</h4>
                            <ol className="space-y-3 text-gray-300">
                                <li className="flex gap-3">
                                    <span className="bg-venuz-pink text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                                    <span><strong>Registro gratuito:</strong> Solo necesitas un email válido. No se requiere tarjeta para ver contenido gratuito.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="bg-venuz-pink text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                                    <span><strong>Explorar categorías:</strong> Filtra por idioma (español), país (México, Colombia, etc.), categoría (Latinas, MILF, Trans, etc.) o popularidad.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="bg-venuz-pink text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                                    <span><strong>Ver shows gratuitos:</strong> Entra a cualquier sala y disfruta del show público. Puedes chatear gratis con otros usuarios.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="bg-venuz-pink text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">4</span>
                                    <span><strong>Comprar tokens (opcional):</strong> Para dar propinas, solicitar shows privados o desbloquear contenido exclusivo.</span>
                                </li>
                            </ol>
                        </div>
                    </section>

                    {/* Section 3: Precios */}
                    <section id="precios">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <CreditCard className="text-venuz-pink" />
                            Precios en México (2026)
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-6">
                            Una de las grandes ventajas de Stripchat para usuarios mexicanos es la variedad de métodos de pago disponibles. Aquí te dejamos una tabla actualizada de precios:
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="py-3 px-4 text-white">Paquete</th>
                                        <th className="py-3 px-4 text-white">Tokens</th>
                                        <th className="py-3 px-4 text-white">Precio USD</th>
                                        <th className="py-3 px-4 text-white">Precio MXN (aprox)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300">
                                    <tr className="border-b border-gray-800">
                                        <td className="py-3 px-4">Pequeño</td>
                                        <td className="py-3 px-4">90 tokens</td>
                                        <td className="py-3 px-4">$9.99</td>
                                        <td className="py-3 px-4">~$200 MXN</td>
                                    </tr>
                                    <tr className="border-b border-gray-800">
                                        <td className="py-3 px-4">Mediano</td>
                                        <td className="py-3 px-4">200 tokens</td>
                                        <td className="py-3 px-4">$19.99</td>
                                        <td className="py-3 px-4">~$400 MXN</td>
                                    </tr>
                                    <tr className="border-b border-gray-800">
                                        <td className="py-3 px-4">Grande</td>
                                        <td className="py-3 px-4">520 tokens</td>
                                        <td className="py-3 px-4">$49.99</td>
                                        <td className="py-3 px-4">~$1,000 MXN</td>
                                    </tr>
                                    <tr className="border-b border-gray-800 bg-venuz-pink/10">
                                        <td className="py-3 px-4 font-bold text-venuz-pink">Ultimate (Mejor valor)</td>
                                        <td className="py-3 px-4">1,085 tokens</td>
                                        <td className="py-3 px-4">$99.99</td>
                                        <td className="py-3 px-4">~$2,000 MXN</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mt-6">
                            <h4 className="font-bold text-blue-400 mb-2">💡 Tip para mexicanos:</h4>
                            <p className="text-gray-300 text-sm">
                                Stripchat acepta tarjetas Visa/Mastercard mexicanas sin problema. Si tu banco bloquea el cargo (por ser sitio internacional), puedes usar una tarjeta digital de Mercado Pago o comprar cripto (USDT) para pagar sin restricciones bancarias.
                            </p>
                        </div>
                    </section>

                    {/* Section 4: Seguridad */}
                    <section id="seguridad">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Shield className="text-venuz-pink" />
                            ¿Es Seguro Stripchat?
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            <strong>Sí, Stripchat es una plataforma legítima y segura.</strong> Después de más de 8 años operando, mantiene una reputación sólida en la industria. Aquí está nuestro análisis de seguridad:
                        </p>

                        <div className="grid md:grid-cols-2 gap-4 my-6">
                            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                                <h4 className="font-bold text-green-400 mb-3">✅ Lo Seguro</h4>
                                <ul className="text-gray-300 text-sm space-y-2">
                                    <li>• Cifrado SSL/TLS en todas las transacciones</li>
                                    <li>• Facturación discreta (no aparece "Stripchat" en estados de cuenta)</li>
                                    <li>• 2FA disponible para proteger tu cuenta</li>
                                    <li>• Verificación de edad obligatoria para modelos</li>
                                    <li>• No venden datos a terceros</li>
                                </ul>
                            </div>
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                                <h4 className="font-bold text-yellow-400 mb-3">⚠️ Precauciones</h4>
                                <ul className="text-gray-300 text-sm space-y-2">
                                    <li>• Nunca compartas datos personales reales en el chat</li>
                                    <li>• No envíes dinero fuera de la plataforma</li>
                                    <li>• Usa una contraseña única y activa 2FA</li>
                                    <li>• Cuidado con modelos que piden contacto externo</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Modelos Latinas */}
                    <section id="modelos">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            🇲🇽 Modelos Latinas en Stripchat
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            Este es uno de los puntos fuertes de Stripchat. La plataforma tiene <strong>la mayor comunidad de modelos latinoamericanas</strong> de cualquier sitio de webcams. En cualquier momento del día puedes encontrar cientos de modelos de México, Colombia, Venezuela, Argentina y otros países de habla hispana.
                        </p>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            La categoría "Latinas" en Stripchat incluye subcategorías como "Mexicanas", "Colombianas", "Venezolanas", y más. También puedes filtrar por idioma "Español" para asegurarte de encontrar modelos con las que puedas chatear cómodamente.
                        </p>
                    </section>

                    {/* Section 6: Pros y Cons */}
                    <section id="pros-cons">
                        <h2 className="text-2xl font-bold text-white mb-6">Pros y Contras</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
                                <h4 className="font-bold text-green-400 mb-4 text-lg">✅ Ventajas</h4>
                                <ul className="text-gray-300 space-y-3">
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                        <span>Mayor selección de modelos latinas del mundo</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                        <span>Calidad de video hasta 4K</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                        <span>Acepta tarjetas mexicanas sin problemas</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                        <span>Interfaz moderna y rápida</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                        <span>Shows VR disponibles</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                        <span>Ver contenido gratuito sin registrarse</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                                <h4 className="font-bold text-red-400 mb-4 text-lg">❌ Desventajas</h4>
                                <ul className="text-gray-300 space-y-3">
                                    <li className="flex items-start gap-2">
                                        <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                        <span>Los shows privados pueden ser caros</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                        <span>Mucha competencia en horas pico</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                        <span>Requiere buena conexión para 4K sin buffering</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 7: Alternativas */}
                    <section id="alternativas">
                        <h2 className="text-2xl font-bold text-white mb-4">Alternativas a Stripchat</h2>
                        <p className="text-gray-300 mb-6">
                            Si Stripchat no te convence, aquí hay otras opciones que hemos evaluado:
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            {[
                                { name: "CamSoda", rating: 4.6, link: "/webcams/reviews/camsoda", desc: "Innovación técnica" },
                                { name: "Chaturbate", rating: 4.5, link: "/webcams/reviews/chaturbate", desc: "El clásico del mercado" },
                                { name: "LiveJasmin", rating: 4.3, link: "/webcams/reviews/livejasmin", desc: "Modelos premium" },
                            ].map((alt) => (
                                <Link
                                    href={alt.link}
                                    key={alt.name}
                                    className="bg-gray-800/50 rounded-xl p-4 border border-white/5 hover:border-venuz-pink/30 transition-all group"
                                >
                                    <h4 className="font-bold text-white group-hover:text-venuz-pink">{alt.name}</h4>
                                    <div className="text-yellow-400 text-sm my-1">★ {alt.rating}/5</div>
                                    <p className="text-gray-400 text-sm">{alt.desc}</p>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Section 8: FAQ */}
                    <section id="faq">
                        <h2 className="text-2xl font-bold text-white mb-6">Preguntas Frecuentes</h2>
                        <div className="space-y-4">
                            {[
                                {
                                    q: "¿Stripchat es gratis?",
                                    a: "Sí, puedes ver contenido y chatear gratis. Solo necesitas tokens para shows privados y propinas."
                                },
                                {
                                    q: "¿Aparece 'Stripchat' en mi estado de cuenta?",
                                    a: "No. Los cargos aparecen con nombres genéricos como 'PROBILL' o 'SEGPAY' para proteger tu privacidad."
                                },
                                {
                                    q: "¿Puedo pagar con OXXO?",
                                    a: "Actualmente, Stripchat no acepta OXXO directamente. Puedes usar Mercado Pago para generar una tarjeta virtual y pagar con ella."
                                },
                                {
                                    q: "¿Es legal en México?",
                                    a: "Sí. Ver contenido adulto entre adultos es legal en México. Solo asegúrate de ser mayor de 18 años."
                                },
                            ].map((faq, i) => (
                                <div key={i} className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                                    <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                                    <p className="text-gray-400 text-sm">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA Final */}
                    <section className="bg-gradient-to-r from-venuz-pink/20 to-purple-900/20 border border-venuz-pink/30 rounded-2xl p-8 text-center">
                        <h3 className="text-2xl font-bold text-white mb-4">¿Listo para Probar Stripchat?</h3>
                        <p className="text-gray-300 mb-6">
                            Únete gratis y explora miles de modelos latinas en vivo.
                        </p>
                        <a
                            href="https://stripchat.com"
                            target="_blank"
                            rel="noopener sponsored"
                            className="venuz-button inline-flex items-center gap-2"
                        >
                            Visitar Stripchat <ExternalLink size={16} />
                        </a>
                        <p className="text-xs text-gray-500 mt-4">
                            18+ | Enlace de afiliado - <Link href="/about#affiliate" className="underline">más info</Link>
                        </p>
                    </section>
                </article>

                {/* Affiliate Disclosure */}
                <div className="mt-12 p-4 bg-gray-900/50 rounded-xl border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-400">
                            <strong className="text-yellow-500">Divulgación:</strong> Esta página contiene enlaces de afiliado.
                            Si te registras en Stripchat a través de nuestro enlace, VENUZ puede recibir una comisión sin costo
                            adicional para ti. Esto no afecta nuestras calificaciones ni opiniones, que son 100% independientes.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

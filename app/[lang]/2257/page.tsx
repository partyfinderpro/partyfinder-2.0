import { Metadata } from 'next'
import Header from "@/components/Header";

export const metadata: Metadata = {
    title: '18 U.S.C. 2257 Compliance Statement | VENUZ',
    description: 'VENUZ 2257 compliance statement and record-keeping exemption notice.',
}

export default function Compliance2257Page() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <main className="max-w-4xl mx-auto px-6 py-24">
                <h1 className="text-3xl font-bold text-white mb-8">
                    18 U.S.C. 2257 Record-Keeping Requirements Compliance Statement
                </h1>

                <div className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-venuz-pink mb-4">Declaración de Exención</h2>
                        <p className="text-gray-300 leading-relaxed">
                            VENUZ (venuz.com) <strong>no es productor</strong> (primario o secundario) de ningún
                            contenido visual explícito mostrado en este sitio web. VENUZ actúa únicamente como
                            una plataforma de agregación de contenido, directorio y reseñas, proporcionando
                            enlaces a sitios web de terceros.
                        </p>
                        <p className="text-gray-300 mt-4 leading-relaxed">
                            Todo el contenido visual mostrado en este sitio web es:
                        </p>
                        <ul className="text-gray-300 list-disc pl-6 mt-2 space-y-2">
                            <li>Material promocional licenciado de plataformas de terceros</li>
                            <li>Reseñas y calificaciones generadas por usuarios (solo texto)</li>
                            <li>Fotografía de stock o imágenes generadas por IA</li>
                            <li>Información comercial públicamente disponible de Google Maps y fuentes similares</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-venuz-pink mb-4">Contenido de Terceros</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Para cualquier contenido visual que aparezca en sitios web de terceros enlazados desde VENUZ,
                            los operadores de esos sitios web son responsables de mantener el cumplimiento con
                            18 U.S.C. 2257 y las regulaciones relacionadas. <strong>VENUZ no aloja, almacena ni produce
                                ningún contenido visual sexualmente explícito.</strong>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-venuz-pink mb-4">Verificación de Edad</h2>
                        <p className="text-gray-300 leading-relaxed">
                            VENUZ requiere que todos los usuarios tengan 18 años de edad o más (o la edad de mayoría
                            en su jurisdicción) para acceder a este sitio web. Al usar este sitio web, los usuarios
                            confirman que cumplen con estos requisitos de edad.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-venuz-pink mb-4">Custodio de Registros</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Como VENUZ no produce contenido visual sujeto a los requisitos 2257,
                            <strong> no se designa ningún custodio de registros</strong> para este propósito. Para consultas
                            de mantenimiento de registros relacionadas con contenido en sitios web de terceros,
                            contacte directamente a esos sitios web.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-venuz-pink mb-4">Contacto</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Para preguntas sobre esta declaración de cumplimiento:<br />
                            <a href="mailto:legal@venuz.com" className="text-venuz-pink hover:underline">
                                legal@venuz.com
                            </a>
                        </p>
                    </section>

                    <section className="text-sm text-gray-500 mt-12 pt-6 border-t border-gray-700">
                        <p>Última actualización: 31 de enero de 2026</p>
                    </section>
                </div>
            </main>
        </div>
    )
}

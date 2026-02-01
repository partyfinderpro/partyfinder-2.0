"use client";

import Header from "@/components/Header";
import { motion } from "framer-motion";
import { Shield, Users, MapPin, CheckCircle, Mail, Send } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <main className="max-w-4xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                >
                    {/* Hero */}
                    <section className="text-center mb-12">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-venuz-pink to-purple-500 bg-clip-text text-transparent mb-6">
                            Sobre VENUZ
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            La plataforma que está revolucionando el entretenimiento adulto y vida nocturna en México
                        </p>
                    </section>

                    {/* Historia */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <MapPin className="text-venuz-pink" />
                            Nuestra Historia
                        </h2>
                        <div className="text-gray-300 space-y-4 leading-relaxed">
                            <p>
                                VENUZ nació en <strong>2025 en Puerto Vallarta, México</strong>, de la frustración de no encontrar
                                información confiable sobre la vida nocturna y el entretenimiento adulto en la región.
                            </p>
                            <p>
                                Mientras que otras ciudades del mundo tenían plataformas sofisticadas para descubrir
                                venues, eventos y entretenimiento, en México solo existían directorios desactualizados
                                o sitios de dudosa procedencia que no respetaban la privacidad del usuario.
                            </p>
                            <p>
                                Decidimos crear algo diferente: una plataforma que combinara la tecnología más
                                avanzada (nuestro <strong>Highway Algorithm™</strong>, geolocalización, verificación en tiempo real)
                                con un profundo conocimiento local del mercado mexicano y latinoamericano.
                            </p>
                        </div>
                    </section>

                    {/* Misión */}
                    <section className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 rounded-2xl p-8 border border-pink-500/20">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Shield className="text-venuz-pink" />
                            Nuestra Misión
                        </h2>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Democratizar el acceso a entretenimiento adulto <strong>seguro, verificado y de calidad</strong>
                            en México y Latinoamérica, protegiendo tanto a usuarios como a creadores de contenido,
                            mientras generamos valor real para todos los participantes del ecosistema.
                        </p>
                    </section>

                    {/* Equipo */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Users className="text-venuz-pink" />
                            Nuestro Equipo
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-white/5 hover:border-pink-500/30 transition-colors">
                                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
                                    📝
                                </div>
                                <h3 className="text-white font-semibold mb-2">Director Editorial</h3>
                                <p className="text-gray-400 text-sm">
                                    +5 años cubriendo vida nocturna en México. Ex-editor de publicaciones de lifestyle premium.
                                </p>
                            </div>

                            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-white/5 hover:border-pink-500/30 transition-colors">
                                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
                                    ✅
                                </div>
                                <h3 className="text-white font-semibold mb-2">Líder de Verificación</h3>
                                <p className="text-gray-400 text-sm">
                                    Responsable de validar cada venue, modelo y servicio en nuestra plataforma con estándares estrictos.
                                </p>
                            </div>

                            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-white/5 hover:border-pink-500/30 transition-colors">
                                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
                                    🧠
                                </div>
                                <h3 className="text-white font-semibold mb-2">Director de Tecnología</h3>
                                <p className="text-gray-400 text-sm">
                                    Arquitecto del Highway Algorithm™ y sistemas de IA que personalizan tu experiencia.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Metodología */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <CheckCircle className="text-venuz-pink" />
                            Nuestra Metodología de Verificación
                        </h2>
                        <div className="space-y-4">
                            {[
                                {
                                    step: 1,
                                    title: "Investigación Inicial",
                                    desc: "Recopilamos datos de múltiples fuentes: Google Maps, redes sociales, sitios oficiales y reportes de usuarios reales."
                                },
                                {
                                    step: 2,
                                    title: "Verificación Manual",
                                    desc: "Nuestro equipo local verifica la existencia, legitimidad y calidad de cada venue antes de publicarlo."
                                },
                                {
                                    step: 3,
                                    title: "Testing de Plataformas",
                                    desc: "Para webcams y sitios de afiliados, probamos personalmente cada plataforma evaluando seguridad, métodos de pago y experiencia de usuario en México."
                                },
                                {
                                    step: 4,
                                    title: "Actualización Continua",
                                    desc: "Reviews y listings se actualizan mensualmente para reflejar cambios en precios, políticas o calidad del servicio."
                                }
                            ].map((item) => (
                                <div key={item.step} className="flex gap-4">
                                    <span className="bg-venuz-pink text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">
                                        {item.step}
                                    </span>
                                    <div>
                                        <h4 className="text-white font-medium">{item.title}</h4>
                                        <p className="text-gray-400 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Affiliate Transparency */}
                    <section className="bg-gray-800/50 rounded-xl p-6 border border-yellow-500/20" id="affiliate">
                        <h2 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Transparencia de Afiliados</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            VENUZ participa en programas de afiliados con plataformas de webcams como
                            Stripchat, CamSoda y otras. Cuando haces clic en ciertos enlaces y te registras
                            o realizas una compra, podemos recibir una comisión <strong>sin costo adicional para ti</strong>.
                        </p>
                        <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                            <strong className="text-white">Importante:</strong> Nuestras calificaciones y
                            recomendaciones <strong>NO están influenciadas</strong> por compensaciones de afiliados.
                            Evaluamos cada plataforma de forma independiente usando nuestra metodología estricta.
                        </p>
                    </section>

                    {/* Contacto */}
                    <section className="text-center pt-8 border-t border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">¿Preguntas?</h2>
                        <p className="text-gray-400 mb-6">
                            Estamos aquí para ayudarte
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="mailto:contacto@venuz.com"
                                className="venuz-button flex items-center gap-2"
                            >
                                <Mail size={18} />
                                contacto@venuz.com
                            </a>
                            <a
                                href="https://telegram.me/venuzoficial"
                                target="_blank"
                                rel="noopener"
                                className="venuz-button-secondary flex items-center gap-2"
                            >
                                <Send size={18} />
                                Telegram
                            </a>
                        </div>
                    </section>
                </motion.div>
            </main>
        </div>
    );
}

"use client";

import Header from "@/components/Header";
import { motion } from "framer-motion";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <main className="max-w-4xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert prose-pink max-w-none"
                >
                    <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>
                    <p className="text-gray-400">Última actualización: 31 de enero de 2026</p>

                    <section className="mt-8 space-y-6">
                        <h2 className="text-2xl font-semibold">1. Recopilación de Información</h2>
                        <p>En VENUZ, la privacidad de nuestros usuarios es primordial. Recopilamos información básica necesaria para el funcionamiento del Highway Algorithm, incluyendo:</p>
                        <ul className="list-disc pl-6 text-gray-400">
                            <li>Datos de navegación anónimos.</li>
                            <li>Preferencias de categorías (webcams, eventos, clubs) para personalización.</li>
                            <li>Ubicación aproximada para mostrar contenido local relevante.</li>
                        </ul>

                        <h2 className="text-2xl font-semibold">2. Uso de Cookies</h2>
                        <p>Utilizamos cookies para recordar tu ciudad seleccionada y tus preferencias del algoritmo. Esto nos permite ofrecerte una experiencia fluida sin necesidad de iniciar sesión constantemente.</p>

                        <h2 className="text-2xl font-semibold">3. Divulgación a Terceros</h2>
                        <p>VENUZ no vende ni alquila tus datos personales. Al hacer clic en enlaces de afiliados externos (como Stripchat o CamSoda), estarás sujeto a las políticas de privacidad de dichos sitios.</p>

                        <h2 className="text-2xl font-semibold">4. Seguridad</h2>
                        <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos contra el acceso no autorizado.</p>
                    </section>
                </motion.div>
            </main>
        </div>
    );
}

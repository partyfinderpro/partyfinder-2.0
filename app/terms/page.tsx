"use client";

import Header from "@/components/Header";
import { motion } from "framer-motion";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <main className="max-w-4xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert prose-pink max-w-none"
                >
                    <h1 className="text-4xl font-bold mb-8">Términos y Condiciones</h1>

                    <section className="mt-8 space-y-6">
                        <h2 className="text-2xl font-semibold text-pink-500">1. Aceptación de los Términos</h2>
                        <p>Al acceder a VENUZ, confirmas que tienes al menos 18 años de edad y que aceptas cumplir con estos términos y condiciones de uso.</p>

                        <h2 className="text-2xl font-semibold">2. Naturaleza del Servicio</h2>
                        <p>VENUZ es una plataforma de descubrimiento y agregación de contenido. No operamos directamente servicios de webcam ni establecimientos nocturnos. Actuamos como un canal de información y afiliación.</p>

                        <h2 className="text-2xl font-semibold">3. Responsabilidad del Contenido</h2>
                        <p>Aunque nos esforzamos por verificar todo el contenido, la información sobre horarios, precios y disponibilidad en sitios externos es responsabilidad de sus respectivos operadores.</p>

                        <h2 className="text-2xl font-semibold">4. Divulgación de Afiliados</h2>
                        <p>VENUZ recibe compensación por parte de algunos socios comerciales cuando los usuarios realizan acciones en sus plataformas a través de nuestros enlaces. Esta compensación no influye en las tarifas que pagas.</p>
                    </section>
                </motion.div>
            </main>
        </div>
    );
}

"use client";

import Header from "@/components/Header";
import { motion } from "framer-motion";
import { Send, Mail, MessageSquare } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <main className="max-w-4xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-8"
                >
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-venuz-pink to-purple-500 bg-clip-text text-transparent">
                        Contacto & Soporte
                    </h1>
                    <p className="text-xl text-gray-400">
                        ¿Tienes dudas, sugerencias o quieres anunciar tu negocio en VENUZ?
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 text-left">
                        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-pink-500/50 transition-colors group">
                            <Mail className="w-10 h-10 text-pink-500 mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-bold mb-2">Email Oficial</h3>
                            <p className="text-gray-400 mb-4">Para consultas generales y soporte técnico.</p>
                            <a href="mailto:support@venuz.app" className="text-pink-400 font-medium hover:underline">
                                support@venuz.app
                            </a>
                        </div>

                        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-400/50 transition-colors group">
                            <Send className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-bold mb-2">Canal Telegram</h3>
                            <p className="text-gray-400 mb-4">Síguenos para actualizaciones en tiempo real y soporte rápido.</p>
                            <a href="https://t.me/venuzoficial" className="text-blue-400 font-medium hover:underline">
                                @venuzoficial
                            </a>
                        </div>
                    </div>

                    <div className="mt-16 p-8 bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-3xl">
                        <h2 className="text-2xl font-bold mb-4">¿Quieres ser socio?</h2>
                        <p className="text-gray-400 mb-6">
                            Si eres manager de una agencia de modelos o dueño de un club, queremos trabajar contigo.
                        </p>
                        <button className="venuz-button">
                            Registra tu Negocio
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

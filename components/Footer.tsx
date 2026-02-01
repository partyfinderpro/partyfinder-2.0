"use client";

import Link from "next/link";
import { Twitter, Instagram, Send, Heart, Shield, HelpCircle } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-black border-t border-white/10 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                    {/* Brand & Mission */}
                    <div className="col-span-2 md:col-span-1">
                        <h2 className="text-2xl font-black bg-gradient-to-r from-pink-500 to-amber-500 bg-clip-text text-transparent mb-4">
                            VENUZ
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            La plataforma líder de entretenimiento y vida nocturna en México.
                            Seguridad, verificación y experiencias exclusivas.
                        </p>
                        <div className="flex gap-4">
                            <Link href="https://twitter.com/venuzapp" className="text-gray-500 hover:text-pink-500 transition-colors">
                                <Twitter size={20} />
                            </Link>
                            <Link href="https://telegram.me/venuzoficial" className="text-gray-500 hover:text-blue-400 transition-colors">
                                <Send size={20} />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Shield size={16} className="text-pink-500" />
                            Explorar
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link href="/webcams" className="hover:text-white transition-colors">Webcams Reviews</Link></li>
                            <li><Link href="/nightlife" className="hover:text-white transition-colors">Vida Nocturna</Link></li>
                            <li><Link href="/escorts" className="hover:text-white transition-colors">Escorts Verificadas</Link></li>
                            <li><Link href="/guias" className="hover:text-white transition-colors">Guías de Ciudad</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <HelpCircle size={16} className="text-pink-500" />
                            Soporte
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link href="/about" className="hover:text-white transition-colors">Sobre Nosotros</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
                            <li><Link href="/faq" className="hover:text-white transition-colors">Preguntas Frecuentes</Link></li>
                            <li><Link href="/admin" className="hover:text-white transition-colors">Área de Negocios</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-bold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link href="/terms" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link></li>
                            <li><Link href="/cookies" className="hover:text-white transition-colors">Política de Cookies</Link></li>
                            <li><Link href="/2257" className="hover:text-white transition-colors">Cumplimiento 2257</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Affiliate Disclosure */}
                <div className="border-t border-white/5 pt-8 mb-8 text-center max-w-3xl mx-auto">
                    <p className="text-[10px] text-gray-600 leading-relaxed uppercase tracking-widest">
                        Affiliate Disclosure: VENUZ participates in various affiliate marketing programs,
                        which means we may get paid commissions on editorially chosen products purchased
                        through our links to retailer sites.
                    </p>
                </div>

                {/* Bottom */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600 border-t border-white/5 pt-8">
                    <p>© {currentYear} VENUZ. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Made with <Heart size={10} className="text-pink-500 fill-pink-500" /> in Mexico
                    </p>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1">🔞 18+ Only</span>
                        <span className="flex items-center gap-1">🔒 SSL Secure</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

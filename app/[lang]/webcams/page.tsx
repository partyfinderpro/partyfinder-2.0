import Header from "@/components/Header";
import { TrustSignalsBanner } from "@/components/TrustSignalsBanner";
import Link from "next/link";
import { Star, ShieldCheck, ChevronRight } from "lucide-react";

const REVIEWS = [
    {
        name: "Stripchat",
        slug: "stripchat",
        rating: 4.9,
        description: "La plataforma líder con más modelos latinas y pagos locales en México.",
        badge: "Elección del Editor",
        logo: "https://stripchat.com/stripchat-logo.png"
    },
    {
        name: "CamSoda",
        slug: "camsoda",
        rating: 4.6,
        description: "Innovación tecnológica y excelentes shows gratuitos.",
        badge: "Premium",
        logo: "https://cdn.camsoda.com/assets/images/logo.png"
    }
];

export const metadata = {
    title: "Mejores Sitios de Webcams 2026 - Reviews y Opiniones | VENUZ",
    description: "Análisis honestos de las mejores plataformas de webcams. Comparamos Stripchat, CamSoda y más para ayudarte a elegir con seguridad."
};

export default function WebcamsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Header />

            <main className="pt-24 pb-20 max-w-5xl mx-auto px-6">
                <section className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
                        Mejores Sitios de Webcams en México
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl leading-relaxed">
                        Nuestro equipo de expertos analiza y califica las plataformas más populares basándose en seguridad, variedad de modelos latinas y facilidad de pago.
                    </p>
                </section>

                <TrustSignalsBanner variant="compact" className="mb-12 rounded-2xl" />

                <div className="grid gap-6">
                    {REVIEWS.map((review) => (
                        <Link
                            key={review.slug}
                            href={`/webcams/reviews/${review.slug}`}
                            className="group bg-gray-900/50 border border-white/5 hover:border-pink-500/30 rounded-2xl p-6 transition-all hover:bg-white/5 flex flex-col md:flex-row gap-6 items-center"
                        >
                            <div className="w-24 h-24 bg-black rounded-xl flex items-center justify-center p-4">
                                <img src={review.logo} alt={review.name} className="max-h-full max-w-full object-contain" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                    <h2 className="text-2xl font-bold">{review.name}</h2>
                                    <span className="bg-pink-500/10 text-pink-400 text-xs font-bold px-2 py-1 rounded border border-pink-500/20">
                                        {review.badge}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center md:justify-start gap-1 text-yellow-500 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} fill={i < Math.floor(review.rating) ? "currentColor" : "none"} />
                                    ))}
                                    <span className="ml-2 text-white font-semibold">{review.rating}</span>
                                </div>

                                <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                                    {review.description}
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                                    <ShieldCheck size={14} />
                                    Verificado 2026
                                </div>
                                <div className="bg-white/10 group-hover:bg-pink-500 transition-colors p-3 rounded-full">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <section className="mt-20 border-t border-white/10 pt-10">
                    <h2 className="text-2xl font-bold mb-6">Guía de Seguridad en Webcams</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: "Pagos Seguros", text: "Usa tarjetas virtuales o métodos como OXXO para mayor privacidad." },
                            { title: "Anonimato", text: "Nunca compartas datos personales reales con las modelos." },
                            { title: "Sitios Oficiales", text: "Accede siempre a través de links verificados por agentes autorizados." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/5 p-6 rounded-2xl">
                                <h3 className="font-bold mb-2 text-pink-400">{item.title}</h3>
                                <p className="text-sm text-gray-400">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

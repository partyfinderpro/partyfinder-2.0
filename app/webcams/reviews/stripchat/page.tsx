import WebcamReviewTemplate, { generateReviewMetadata } from "@/components/reviews/ReviewTemplate";
import Header from "@/components/Header";

const stripchatData = {
    name: "Stripchat",
    slug: "stripchat",
    logo: "https://stripchat.com/stripchat-logo.png", // Placeholder URL
    affiliateUrl: "https://stripchat.com/?aff=venuz", // TODO: Trackable link
    rating: 4.9,
    reviewCount: 24500,
    foundedYear: 2016,
    headquarters: "Chipre / Global",
    modelCount: "50,000",
    categories: [
        "Latinas", "Españolas", "MILF", "Trans", "Couples", "VR Cams"
    ],
    paymentMethods: [
        "Visa", "Mastercard", "Crypto", "PayPal", "OXXO Pay"
    ],
    minPrice: "$4.99 USD",
    pros: [
        "La mayor selección de modelos latinas del mundo",
        "Opción de pago vía OXXO disponible en México",
        "Calidad de video 4K en muchos modelos",
        "Interfaz ultra rápida y optimizada",
        "Shows de realidad virtual (VR) líderes",
        "Soporte multilenguaje excelente"
    ],
    cons: [
        "Mucha competencia en horas pico",
        "Requiere buena conexión para 4K"
    ],
    verdict: `Stripchat se mantiene como la plataforma número 1 en nuestra lista para 2026. Su facilidad de pago para usuarios en México (incluyendo OXXO) y la increíble cantidad de modelos latinas la hacen imbatible. Es, sin duda, la experiencia de webcam más completa del mercado actual.`
};

export const metadata = generateReviewMetadata("Stripchat", 2026);

export default function StripchatReviewPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <main className="pt-24 pb-20">
                <WebcamReviewTemplate site={stripchatData} />
            </main>
        </div>
    );
}

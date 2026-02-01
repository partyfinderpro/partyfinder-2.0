import WebcamReviewTemplate, { generateReviewMetadata, exampleSiteData } from "@/components/reviews/ReviewTemplate";
import Header from "@/components/Header";

// Datos específicos para CamSoda con links reales (o placeholders estructurados)
const camsodaData = {
    ...exampleSiteData,
    name: "CamSoda",
    slug: "camsoda",
    affiliateUrl: "https://www.camsoda.com/?aff=venuz", // TODO: Reemplazar con trackable link real
    logo: "https://cdn.camsoda.com/assets/images/logo.png", // Usar URL externa si no hay local
};

export const metadata = generateReviewMetadata("CamSoda", 2026);

export default function CamSodaReviewPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <main className="pt-24 pb-20">
                <WebcamReviewTemplate site={camsodaData} />
            </main>
        </div>
    );
}

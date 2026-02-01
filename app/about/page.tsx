"use client";

import Header from "@/components/Header";
import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Header notificationCount={0} onSearch={() => { }} onCityChange={() => { }} />

            <main className="max-w-4xl mx-auto px-6 py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-venuz-pink to-purple-500 bg-clip-text text-transparent">
                        About VENUZ
                    </h1>

                    <p className="text-xl text-gray-400 leading-relaxed">
                        VENUZ is the next-generation lifestyle and entertainment discovery platform.
                        Powered by our proprietary **Highway Algorithm**, we provide a personalized
                        experience connecting users with verified adult entertainment, nightlife, and
                        luxury services in Latin America.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                            <h3 className="text-xl font-bold text-venuz-pink mb-2">Our Mission</h3>
                            <p className="text-gray-400">To revolutionize the adult entertainment industry through transparency, AI-driven recommendations, and premium user experiences.</p>
                        </div>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                            <h3 className="text-xl font-bold text-venuz-pink mb-2">Verified Content</h3>
                            <p className="text-gray-400">Every item in our database of 2,200+ venues and performers is manually curated to ensure safety and quality.</p>
                        </div>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">Affiliate Transparency</h2>
                        <p className="text-gray-500 text-sm">
                            VENUZ participates in various affiliate marketing programs. When you click on links
                            to our partners and make a purchase or register, we may receive a commission
                            at no extra cost to you. This helps us maintain our AI infrastructure.
                        </p>
                    </section>
                </motion.div>
            </main>
        </div>
    );
}

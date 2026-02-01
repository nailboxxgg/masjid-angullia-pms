"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, BookOpen, Home, Utensils, HelpCircle } from "lucide-react";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import DonationModal from "@/components/ui/DonationModal";

const funds = [
    {
        id: "mosque",
        name: "Mosque Operations",
        description: "Support the daily maintenance, utilities, and staff of Masjid Angullia.",
        icon: Home,
        color: "bg-blue-500",
        image: "/images/mosque.png"
    },
    {
        id: "education",
        name: "Islamic Education",
        description: "Sponsor books, teachers, and facilities for our Madrasah students.",
        icon: BookOpen,
        color: "bg-green-500",
        image: "/images/mosque2.png" // Placeholder
    },
    {
        id: "ramadan",
        name: "Iftar & Ramadan",
        description: "Provide Iftar meals for the community during the holy month.",
        icon: Utensils,
        color: "bg-orange-500",
        image: "/images/prayer.png" // Placeholder
    },
    {
        id: "general",
        name: "General Zakat/Sadaqah",
        description: "General funds to be used where most needed for the community.",
        icon: Heart,
        color: "bg-pink-500",
        image: "/images/mosque.png" // Placeholder
    }
];

export default function DonationsPage() {
    const [selectedFund, setSelectedFund] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Hero */}
            <section className="bg-primary-900 text-white py-16 px-4 relative">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <AnimationWrapper animation="fadeIn">
                        <div className="absolute top-6 left-6 z-20">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all text-sm font-medium group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Back to Home
                            </Link>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold font-heading mt-8">
                            Invest in Your Akhirah
                        </h1>
                    </AnimationWrapper>
                    <AnimationWrapper animation="fadeIn" delay={0.2}>
                        <p className="text-xl text-primary-100 max-w-2xl mx-auto">
                            "The believer's shade on the Day of Resurrection will be their charity." (Tirmidhi)
                        </p>
                    </AnimationWrapper>
                </div>
            </section>

            {/* Funds Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {funds.map((fund, index) => (
                        <AnimationWrapper key={fund.id} animation="scaleIn" delay={index * 0.1}>
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-xl transition-all h-full flex flex-col">
                                <div className="relative h-48 w-full overflow-hidden">
                                    <div className={`absolute inset-0 ${fund.color} bg-opacity-10 mix-blend-multiply z-10`} />
                                    <Image
                                        src={fund.image}
                                        alt={fund.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 left-4 z-20 bg-white p-2 rounded-lg shadow-sm">
                                        <fund.icon className={`w-6 h-6 ${fund.color.replace('bg-', 'text-')}`} />
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 font-heading">{fund.name}</h3>
                                    <p className="text-gray-600 mb-6 flex-1">{fund.description}</p>

                                    <button
                                        onClick={() => setSelectedFund(fund.name)}
                                        className="w-full py-3 bg-white border-2 border-primary-600 text-primary-700 font-bold rounded-xl hover:bg-primary-600 hover:text-white transition-all"
                                    >
                                        Donate Now
                                    </button>
                                </div>
                            </div>
                        </AnimationWrapper>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-20 py-8 text-center text-gray-500 text-sm border-t border-gray-200">
                <p>&copy; {new Date().getFullYear()} Masjid Angullia. All rights reserved.</p>
                <div className="mt-4 flex justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </footer>

            <DonationModal
                isOpen={!!selectedFund}
                onClose={() => setSelectedFund(null)}
                fundName={selectedFund || ""}
            />
        </div>
    );
}

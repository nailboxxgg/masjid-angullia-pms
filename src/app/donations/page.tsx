"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, BookOpen, Home, Utensils, HelpCircle } from "lucide-react";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import DonationModal from "@/components/ui/DonationModal";
import Footer from "@/components/layout/Footer";
import dynamic from "next/dynamic";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

const Modal = dynamic(() => import("@/components/ui/modal"), { ssr: false });

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
    const router = useRouter();
    const [selectedFund, setSelectedFund] = useState<string | null>(null);
    const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState("");

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError("");

        const form = e.target as HTMLFormElement;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/admin");
        } catch (err: unknown) {
            console.error(err);
            setLoginError("Invalid admin credentials.");
        } finally {
            setIsLoading(false);
        }
    };

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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {funds.map((fund, index) => (
                        <AnimationWrapper key={fund.id} animation="scaleIn" delay={index * 0.1}>
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-xl transition-all h-full flex flex-col">
                                <div className="relative h-48 w-full overflow-hidden">
                                    <div className={`absolute inset-0 ${fund.color}/10 mix-blend-multiply z-10`} />
                                    <Image
                                        src={fund.image}
                                        alt={fund.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm transition-all group-hover:bg-white">
                                        <fund.icon className={`w-6 h-6 ${fund.color.replace('bg-', 'text-')} opacity-90 group-hover:opacity-100 transition-opacity`} />
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
            <Footer onAdminClick={() => setIsAdminLoginOpen(true)} />

            <DonationModal
                isOpen={!!selectedFund}
                onClose={() => setSelectedFund(null)}
                fundName={selectedFund || ""}
            />

            <Modal
                isOpen={isAdminLoginOpen}
                onClose={() => setIsAdminLoginOpen(false)}
                title=""
                className="max-w-md bg-secondary-900 border-secondary-800"
            >
                <div className="text-center flex flex-col items-center mb-6">
                    <div className="bg-primary-500/10 p-3 rounded-full mb-4">
                        <ShieldCheck className="w-10 h-10 text-primary-500" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
                        Admin Portal
                    </h2>
                    <p className="mt-2 text-sm text-secondary-400">
                        Restricted access for authorized personnel only
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleAdminLogin}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-md border-0 py-3 px-3 text-white bg-secondary-800 ring-1 ring-inset ring-secondary-700 placeholder:text-secondary-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                                placeholder="Admin Email"
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type={showAdminPassword ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-md border-0 py-3 pl-3 pr-10 text-white bg-secondary-800 ring-1 ring-inset ring-secondary-700 placeholder:text-secondary-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                                placeholder="Password"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-white transition-colors"
                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                            >
                                {showAdminPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {loginError && (
                        <div className="text-red-400 text-sm text-center bg-red-950/30 p-2 rounded border border-red-900/50">
                            {loginError}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative flex w-full justify-center rounded-md bg-primary-600 px-3 py-3 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-70 transition-all shadow-lg hover:shadow-primary-500/20"
                        >
                            {isLoading ? "Verifying..." : "Access Dashboard"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

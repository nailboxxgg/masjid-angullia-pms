"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, MessageCircle } from "lucide-react";
import Footer from "@/components/layout/Footer";
import FeedbackModal from "@/components/modules/FeedbackModal";

export default function SignupPage() {
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 transition-colors duration-300">
            {/* Top Navigation */}
            <div className="p-4 sm:p-6 flex items-center justify-start max-w-7xl mx-auto w-full">
                <Link
                    href="/"
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-secondary-600 font-medium hover:bg-secondary-50 transition-all shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Home</span>
                </Link>
            </div>

            <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100 text-center">
                    <div className="mx-auto bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Registration Restricted</h2>
                    <p className="text-slate-600">
                        Public registration is currently closed. New family accounts must be created by the masjid administration.
                    </p>
                    <p className="text-sm text-slate-500 mt-4">
                        Please contact the admin office to set up your account.
                    </p>

                    <div className="mt-8 flex flex-col gap-3">
                        <button
                            onClick={() => setIsFeedbackOpen(true)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors shadow-sm"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Contact Admin Support</span>
                        </button>

                        <Link
                            href="/"
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors"
                        >
                            Return to Home
                        </Link>
                    </div>
                </div>
            </main>

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />

            <Footer />
        </div>
    );
}

"use client";

import { MessageSquare, ArrowLeft, Shield } from "lucide-react";
import FeedbackForm from "@/components/modules/FeedbackForm";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export default function FeedbackPage() {
    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col transition-colors duration-300">
            {/* Header Area */}
            <div className="bg-white dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-bold text-sm"
                    >
                        <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden xs:inline">Back</span>
                    </Link>
                    <h1 className="text-base md:text-xl font-bold font-heading text-secondary-900 dark:text-white truncate px-2">Concerns & Feedback</h1>
                    <div className="w-10 md:w-12 shrink-0" />
                </div>
            </div>

            <main className="flex-1 py-12 px-4">
                <div className="max-w-xl mx-auto">
                    <AnimationWrapper animation="reveal" duration={0.8}>
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white font-heading tracking-tight mb-4">We Value Your Voice</h2>
                            <p className="text-secondary-600 dark:text-secondary-400 text-lg">
                                Have a concern, suggestion, or request? Let us know how we can better serve the community.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-secondary-900 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-secondary-200/50 dark:shadow-none border border-secondary-100 dark:border-secondary-800">
                            <FeedbackForm />
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-3 text-secondary-500 dark:text-secondary-400 text-sm font-medium">
                            <Shield className="w-4 h-4 text-primary-500" />
                            <span>Your submission is handled with utmost confidentiality.</span>
                        </div>
                    </AnimationWrapper>
                </div>
            </main>

            <Footer />
        </div>
    );
}

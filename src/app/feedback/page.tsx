"use client";

import { MessageSquare, Shield } from "lucide-react";
import FeedbackForm from "@/components/modules/FeedbackForm";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default function FeedbackPage() {
    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col transition-colors duration-300">
            <Navbar />

            <main className="flex-1 py-12 px-4 pt-24">
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Send, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { submitFeedback, FeedbackType } from "@/lib/feedback";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import Footer from "@/components/layout/Footer";

export default function FeedbackPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [type, setType] = useState<FeedbackType>("Feedback");
    const [message, setMessage] = useState("");

    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        const result = await submitFeedback({
            name,
            email,
            contactNumber: contact,
            type,
            message
        });

        if (result.success) {
            setStatus('success');
            // Clear form
            setName("");
            setEmail("");
            setContact("");
            setMessage("");
            setType("Feedback");
        } else {
            setStatus('error');
        }
    };

    return (
        <AnimationWrapper className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col">
            {/* Top Navigation */}
            <div className="bg-secondary-900 py-6">
                <div className="max-w-7xl mx-auto w-full px-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all text-sm font-medium group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 mb-10">
                <div className="max-w-xl w-full">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold font-heading text-secondary-900 dark:text-secondary-100 mb-2">We Value Your Voice</h1>
                        <p className="text-secondary-500 dark:text-secondary-400">Share your concerns, feedback, or requests to help us improve.</p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-secondary-900 rounded-2xl shadow-xl overflow-hidden border border-secondary-100 dark:border-secondary-800"
                    >
                        {status === 'success' ? (
                            <div className="p-12 text-center">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6"
                                >
                                    <CheckCircle className="w-8 h-8" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">Thank You!</h3>
                                <p className="text-secondary-500 dark:text-secondary-400 mb-8">Your submission has been received. We appreciate your input.</p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="px-6 py-2 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 font-medium rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors"
                                    >
                                        Send Another
                                    </button>
                                    <Link href="/" className="text-sm text-secondary-500 hover:text-primary-600 transition-colors">
                                        Back to Home
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Your Name</label>
                                            <input
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-300 dark:placeholder:text-secondary-500"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Contact Number</label>
                                            <input
                                                required
                                                value={contact}
                                                onChange={(e) => setContact(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                                className="w-full px-4 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-300 dark:placeholder:text-secondary-500"
                                                placeholder="09123456789"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={11}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Email Address (Optional)</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-300 dark:placeholder:text-secondary-500"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Submission Type</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['Concern', 'Feedback', 'Request'] as const).map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setType(t)}
                                                    className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all ${type === t
                                                        ? "bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-400"
                                                        : "bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                                                        }`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Message</label>
                                        <textarea
                                            required
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="w-full h-32 px-4 py-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-300 dark:placeholder:text-secondary-500 resize-none"
                                            placeholder="How can we help or improve?"
                                        />
                                    </div>

                                    {status === 'error' && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2 border border-red-100 dark:border-red-800">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Something went wrong. Please try again later.</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={status === 'submitting'}
                                        className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {status === 'submitting' ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Submit Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </motion.div>

                    {/* Bottom Back Button */}
                    <div className="mt-12 text-center pb-10">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-all text-sm font-bold group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Return to Homepage
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </AnimationWrapper>
    );
}

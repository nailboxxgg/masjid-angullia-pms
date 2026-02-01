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
        <AnimationWrapper className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navigation */}
            <div className="max-w-7xl mx-auto w-full px-6 py-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-secondary-500 hover:text-primary-600 transition-colors font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 mb-10">
                <div className="max-w-xl w-full">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold font-heading text-secondary-900 mb-2">We Value Your Voice</h1>
                        <p className="text-secondary-500">Share your concerns, feedback, or requests to help us improve.</p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-secondary-100"
                    >
                        {status === 'success' ? (
                            <div className="p-12 text-center">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                                >
                                    <CheckCircle className="w-8 h-8" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-secondary-900 mb-2">Thank You!</h3>
                                <p className="text-secondary-500 mb-8">Your submission has been received. We appreciate your input.</p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="px-6 py-2 bg-secondary-100 text-secondary-700 font-medium rounded-lg hover:bg-secondary-200 transition-colors"
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
                                            <label className="text-sm font-medium text-secondary-700">Your Name</label>
                                            <input
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 placeholder:text-secondary-300"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-secondary-700">Contact Number</label>
                                            <input
                                                value={contact}
                                                onChange={(e) => setContact(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 placeholder:text-secondary-300"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-secondary-700">Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 placeholder:text-secondary-300"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-secondary-700">Submission Type</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['Concern', 'Feedback', 'Request'] as const).map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setType(t)}
                                                    className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all ${type === t
                                                        ? "bg-primary-50 border-primary-500 text-primary-700"
                                                        : "bg-white border-secondary-200 text-secondary-600 hover:bg-secondary-50"
                                                        }`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-secondary-700">Message</label>
                                        <textarea
                                            required
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="w-full h-32 px-4 py-3 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 placeholder:text-secondary-300 resize-none"
                                            placeholder="How can we help or improve?"
                                        />
                                    </div>

                                    {status === 'error' && (
                                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
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
                    <div className="mt-8 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-secondary-400 hover:text-secondary-600 transition-colors text-sm">
                            <ArrowLeft className="w-3 h-3" />
                            Return to Homepage
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </AnimationWrapper>
    );
}

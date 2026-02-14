"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle, AlertCircle, User, Phone, Mail, MessageSquare } from "lucide-react";
import { submitFeedback, FeedbackType } from "@/lib/feedback";
import { cn, normalizePhoneNumber } from "@/lib/utils";

export default function FeedbackForm({ onSuccess }: { onSuccess?: () => void }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [type, setType] = useState<FeedbackType>("Concern");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        const result = await submitFeedback({
            name,
            email,
            contactNumber: normalizePhoneNumber(contact),
            type,
            message
        });

        if (result.success) {
            setStatus('success');
            if (onSuccess) setTimeout(onSuccess, 2000);
        } else {
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 px-6 text-center"
            >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-green-50 dark:ring-green-900/20">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-secondary-900 dark:text-white mb-3 tracking-tight">Message Received!</h3>
                <p className="text-secondary-500 dark:text-secondary-400 text-lg max-w-xs mx-auto">
                    Thank you for reaching out. We appreciate your valuable input.
                </p>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name field */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors">
                        <User className="w-4 h-4" />
                    </div>
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-950/50 focus:bg-white dark:focus:bg-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-secondary-900 dark:text-white transition-all placeholder:text-secondary-400 text-base"
                        placeholder="Full Name"
                    />
                </div>

                {/* Contact field */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors">
                        <Phone className="w-4 h-4" />
                    </div>
                    <input
                        required
                        value={contact}
                        onChange={(e) => setContact(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-950/50 focus:bg-white dark:focus:bg-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-secondary-900 dark:text-white transition-all placeholder:text-secondary-400 text-base"
                        placeholder="Enter your mobile number"
                        inputMode="numeric"
                    />
                </div>
            </div>

            {/* Email field */}
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors">
                    <Mail className="w-4 h-4" />
                </div>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-950/50 focus:bg-white dark:focus:bg-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-secondary-900 dark:text-white transition-all placeholder:text-secondary-400 text-base"
                    placeholder="Email Address (Optional)"
                />
            </div>

            {/* Submission Type Toggle */}
            <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary-400 ml-1">Reason for reaching out</label>
                <div className="flex flex-wrap gap-2">
                    {(['Concern', 'Feedback', 'Request', 'Inquiries', 'Registration'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setType(t)}
                            className={cn(
                                "flex-1 py-2.5 px-4 rounded-xl text-sm font-bold border transition-all duration-300",
                                type === t
                                    ? "bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20 scale-[1.02]"
                                    : "bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 text-secondary-600 dark:text-secondary-400 hover:border-primary-300 hover:text-primary-600"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Message field */}
            <div className="relative group">
                <div className="absolute left-4 top-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                </div>
                <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full pl-11 pr-4 pt-3.5 pb-4 h-32 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-950/50 focus:bg-white dark:focus:bg-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-secondary-900 dark:text-white transition-all placeholder:text-secondary-400 resize-none text-base"
                    placeholder="Tell us what's on your mind..."
                />
            </div>

            <AnimatePresence>
                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/30"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="font-medium">Failed to send. Please check your connection and try again.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-4 bg-secondary-900 dark:bg-primary-600 hover:bg-black dark:hover:bg-primary-500 text-white font-black text-lg rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                {status === 'submitting' ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        Send Message
                    </>
                )}
            </button>
        </form>
    );
}

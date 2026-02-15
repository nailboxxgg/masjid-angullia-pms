"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import { recordVisitorPresence } from "@/lib/attendance";
import { normalizePhoneNumber } from "@/lib/utils";

interface AttendancePortalProps {
    onSuccess?: () => void;
    showHomeLink?: boolean;
}

export default function AttendancePortal({ onSuccess, onClose }: AttendancePortalProps & { onClose?: () => void }) {
    // Visitor form state
    const [visitorName, setVisitorName] = useState("");
    const [visitorPhone, setVisitorPhone] = useState("");

    // UI State
    const [actionLoading, setActionLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Auto-refresh success state
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const handleVisitorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitorName.trim()) return;

        setActionLoading(true);
        setError("");

        try {
            const normalizedPhone = normalizePhoneNumber(visitorPhone.trim());
            await recordVisitorPresence(visitorName.trim(), normalizedPhone);
            setSuccess(true);
            setVisitorName("");
            setVisitorPhone("");
            if (onSuccess) onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to record presence");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto w-full relative">
            <AnimatePresence mode="wait">
                {success ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        className="bg-white dark:bg-secondary-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/5 p-8 md:p-12 text-center relative"
                    >
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-500 hover:text-secondary-900 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}

                        <div className="space-y-8 py-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                                className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30"
                            >
                                <CheckCircle2 className="w-14 h-14" />
                            </motion.div>

                            <div className="space-y-3">
                                <h2 className="text-4xl font-black text-secondary-900 dark:text-white font-heading tracking-tight">
                                    Welcome!
                                </h2>
                                <p className="text-lg font-medium text-secondary-500 dark:text-secondary-400 leading-relaxed">
                                    Presence recorded successfully.<br />
                                    <span className="text-primary-600 dark:text-primary-400">Have a blessed visit.</span>
                                </p>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="pt-4"
                            >
                                <div className="h-1.5 w-32 bg-secondary-100 dark:bg-secondary-800 rounded-full mx-auto overflow-hidden">
                                    <motion.div
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "100%" }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="h-full bg-emerald-500 w-1/2 rounded-full"
                                    />
                                </div>
                                <p className="text-[10px] text-secondary-400 uppercase tracking-[0.2em] font-black mt-3">Resetting Portal...</p>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-secondary-900 rounded-[2.5rem] overflow-hidden transition-all duration-300 shadow-2xl border border-slate-100 dark:border-white/5 relative"
                    >
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-full bg-secondary-50 dark:bg-secondary-800 text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}

                        <div className="px-8 pt-10 pb-6 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-6 font-heading text-3xl font-black shadow-inner">
                                V
                            </div>
                            <h1 className="text-3xl font-black text-secondary-900 dark:text-white font-heading tracking-tight">
                                Visitor Entry
                            </h1>
                            <p className="mt-2 text-sm font-medium text-secondary-500 dark:text-secondary-400">
                                Recording your presence helps us serve you better.
                            </p>
                        </div>

                        <div className="px-10 pb-12">
                            <form onSubmit={handleVisitorSubmit} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-[0.2em] ml-1 block">Full Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={visitorName}
                                        onChange={(e) => setVisitorName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full bg-secondary-50 dark:bg-secondary-800/50 border-0 rounded-2xl px-5 py-4 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all font-bold placeholder:font-medium placeholder:text-secondary-400 shadow-inner"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-[0.2em] ml-1 block">Phone Number <span className="text-secondary-300 normal-case tracking-normal">(Optional)</span></label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        value={visitorPhone}
                                        onChange={(e) => setVisitorPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                        placeholder="Enter your mobile number"
                                        className="w-full bg-secondary-50 dark:bg-secondary-800/50 border-0 rounded-2xl px-5 py-4 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all font-bold placeholder:font-medium placeholder:text-secondary-400 shadow-inner"
                                    />
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-4.5 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-base uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Record My Visit"}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

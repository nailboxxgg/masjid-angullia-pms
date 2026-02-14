"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import { recordVisitorPresence } from "@/lib/attendance";

interface AttendancePortalProps {
    onSuccess?: () => void;
    showHomeLink?: boolean;
}

export default function AttendancePortal({ onSuccess }: AttendancePortalProps) {
    // Visitor form state
    const [visitorName, setVisitorName] = useState("");
    const [visitorPhone, setVisitorPhone] = useState("");

    // UI State
    const [actionLoading, setActionLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleVisitorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitorName.trim()) return;

        setActionLoading(true);
        setError("");

        try {
            await recordVisitorPresence(visitorName.trim(), visitorPhone.trim());
            setSuccess(true);
            setVisitorName("");
            setVisitorPhone("");
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to record presence");
        } finally {
            setActionLoading(false);
        }
    };

    if (success) {
        return (
            <AnimationWrapper animation="reveal" duration={0.8}>
                <div className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce-slow">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-secondary-900 dark:text-white font-heading">
                            Welcome!
                        </h2>
                        <p className="text-secondary-500 dark:text-secondary-400 mt-2">
                            Your visit has been recorded.
                        </p>
                    </div>
                    <button
                        onClick={() => setSuccess(false)}
                        className="text-xs text-primary-500 uppercase tracking-widest font-bold hover:underline"
                    >
                        Register Another Guest
                    </button>
                    <div className="pt-4">
                        <p className="text-[10px] text-secondary-400 uppercase tracking-wider font-bold">Autorefreshing to form...</p>
                    </div>
                </div>
            </AnimationWrapper>
        );
    }

    return (
        <div className="max-w-md mx-auto w-full space-y-4">
            <AnimationWrapper animation="reveal" duration={0.8}>
                <div className="bg-white dark:bg-secondary-900 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl border border-slate-100 dark:border-white/5">
                    <div className="px-8 pt-8 pb-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4 group font-heading text-3xl font-bold">
                            V
                        </div>
                        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white font-heading tracking-tight">
                            Visitor Entry
                        </h1>
                        <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
                            Recording your presence helps us serve you better.
                        </p>
                    </div>
                    <div className="px-8 pb-10">
                        <form onSubmit={handleVisitorSubmit} className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1.5 block">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={visitorName}
                                    onChange={(e) => setVisitorName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3.5 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1.5 block">Phone Number <span className="text-secondary-300 normal-case tracking-normal">(Optional)</span></label>
                                <input
                                    type="tel"
                                    value={visitorPhone}
                                    onChange={(e) => setVisitorPhone(e.target.value)}
                                    placeholder="+65..."
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3.5 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-lg text-center animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                            >
                                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Record My Visit"}
                            </button>
                        </form>
                    </div>
                </div>
            </AnimationWrapper>
        </div>
    );
}

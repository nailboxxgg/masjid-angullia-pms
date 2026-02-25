"use client";

import { useState } from "react";
import Modal from "./modal";
import { subscribeToNotifications } from "@/lib/notifications";
import { Loader2, CheckCircle, Smartphone } from "lucide-react";

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');
        setMessage("");

        try {
            // Append +63 to the number
            const fullNumber = `+63${phone.replace(/^0+/, '')}`; // Remove leading zeros if user typed them by mistake

            const result = await subscribeToNotifications(fullNumber);
            if (result.success) {
                setStatus('success');
                setMessage(result.message);
                setTimeout(() => {
                    onClose();
                    setPhone("");
                    setStatus('idle');
                    setMessage("");
                }, 2000);
            } else {
                setStatus('error');
                setMessage(result.message);
            }
        } catch (_error) {
            setStatus('error');
            setMessage("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Get Text Updates"
            className="max-w-sm"
        >
            <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-primary-600 dark:text-primary-400">
                    <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-secondary-600 dark:text-secondary-400 mb-4 sm:mb-6 text-sm leading-relaxed max-w-[280px] mx-auto">
                    Receive urgent announcements, prayer time changes, and event reminders directly to your mobile phone.
                </p>

                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-4 text-green-600 animate-fade-in">
                        <CheckCircle className="w-12 h-12 mb-2" />
                        <span className="font-bold">{message}</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubscribe} className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="Enter your mobile number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                                className="w-full h-12 px-4 rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-lg tracking-widest text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:tracking-normal placeholder:text-secondary-400 dark:placeholder:text-secondary-500"
                                required
                            />
                        </div>
                        {status === 'error' && (
                            <p className="text-red-500 text-xs">{message}</p>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading || phone.length !== 11}
                            className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Subscribe Free"}
                        </button>
                    </form>
                )}

                <p className="text-xs text-secondary-400 mt-4 sm:mt-6 leading-relaxed">
                    We simulate SMS for prototype verification.<br className="hidden sm:block" /> No real charges apply.
                </p>
            </div>
        </Modal>
    );
}

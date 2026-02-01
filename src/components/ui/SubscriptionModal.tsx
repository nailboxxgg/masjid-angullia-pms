"use client";

import { useState } from "react";
import Modal from "./modal";
import { subscribeToNotifications } from "@/lib/notifications";
import { Bell, Loader2, CheckCircle, Smartphone } from "lucide-react";

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
            const result = await subscribeToNotifications(phone);
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
        } catch (error) {
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
                <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                    <Smartphone className="w-6 h-6" />
                </div>
                <p className="text-secondary-600 mb-6 text-sm">
                    Receive urgent announcements, prayer time changes, and event reminders directly to your mobile phone.
                </p>

                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-4 text-green-600 animate-fade-in">
                        <CheckCircle className="w-12 h-12 mb-2" />
                        <span className="font-bold">{message}</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubscribe} className="space-y-4">
                        <div className="relative">
                            <input
                                type="tel"
                                placeholder="09xxxxxxxxx"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                                className="w-full h-12 px-4 rounded-xl border border-secondary-300 text-center text-lg tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:tracking-normal"
                                required
                            />
                        </div>
                        {status === 'error' && (
                            <p className="text-red-500 text-xs">{message}</p>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading || phone.length < 11}
                            className="w-full h-10 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe Free"}
                        </button>
                    </form>
                )}

                <p className="text-[10px] text-secondary-400 mt-4">
                    We simulate SMS for prototype verification. No real charges apply.
                </p>
            </div>
        </Modal>
    );
}

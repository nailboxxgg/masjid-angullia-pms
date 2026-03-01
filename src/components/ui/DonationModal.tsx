"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Copy, Smartphone } from "lucide-react";
import { QRPhTransaction } from "@/lib/instapay";
import { generatePaymentQR, verifyPaymentStatus } from "@/app/actions/donations";
import { useRouter } from "next/navigation";

import { addDonation } from "@/lib/donations";
import { Donation } from "@/lib/types";

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
    fundName: string;
}

export default function DonationModal({ isOpen, onClose, fundName }: DonationModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<"details" | "loading" | "qr" | "verifying">("details");
    const [amount, setAmount] = useState<string>("");
    const [donorName, setDonorName] = useState("");
    const [transaction, setTransaction] = useState<QRPhTransaction | null>(null);

    const handleGenerateQR = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isNaN(Number(amount))) return;

        setStep("loading");
        try {
            const result = await generatePaymentQR(Number(amount), `Donation to ${fundName}`);
            setTransaction(result);
            setStep("qr");
        } catch (error) {
            console.error("Failed to generate QR", error);
            setStep("details"); // Go back on error
        }
    };

    const handleConfirmPayment = async () => {
        if (!transaction) return;
        setStep("verifying");

        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const status = await verifyPaymentStatus(transaction.referenceNumber);

            if (status === "completed") {
                // Map fund name to Donation Type
                let donationType: Donation['type'] = 'General';
                const lowerFund = fundName.toLowerCase();
                if (lowerFund.includes('education')) donationType = 'Education';
                else if (lowerFund.includes('meals')) donationType = 'General Donation';
                else if (lowerFund.includes('construction') || lowerFund.includes('mosque')) donationType = 'Construction';
                else if (lowerFund.includes('welfare')) donationType = 'Community Welfare';

                await addDonation({
                    amount: transaction.amount,
                    donorName: donorName || "Anonymous",
                    type: donationType,
                    date: Date.now(),
                    status: 'completed',
                    paymentMethod: 'qr_ph',
                    referenceNumber: transaction.referenceNumber,
                    isAnonymous: !donorName,
                    message: `Donation to ${fundName}`
                });

                try {
                    router.push("/donations/success");
                } catch {
                    window.location.href = "/donations/success";
                }
            } else {
                try {
                    router.push("/donations/failed");
                } catch {
                    window.location.href = "/donations/failed";
                }
            }
        } catch (error) {
            console.error("Donation processing error:", error);
            window.location.href = "/donations/failed";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog static open={isOpen} onClose={onClose} className="relative z-50">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-secondary-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative transition-colors"
                        >
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8">
                                <h3 className="text-xl font-bold text-center mb-1 text-secondary-900 dark:text-secondary-100 font-heading">
                                    Donate to {fundName}
                                </h3>

                                {step === "details" && (
                                    <form onSubmit={handleGenerateQR} className="space-y-6 mt-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Amount (₱)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-lg font-semibold text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 dark:placeholder:text-secondary-500"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Name (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={donorName}
                                                    onChange={(e) => setDonorName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 dark:placeholder:text-secondary-500"
                                                    placeholder="Anonymous"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-600/30 transition-all transform hover:-translate-y-1"
                                        >
                                            Generate QR Code
                                        </button>
                                    </form>
                                )}

                                {step === "loading" && (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-6">
                                        <div className="relative w-20 h-20">
                                            <motion.span
                                                className="absolute inset-0 border-4 border-primary-200 rounded-full"
                                            />
                                            <motion.span
                                                className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            />
                                            <motion.div
                                                className="absolute inset-0 flex items-center justify-center"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                <Smartphone className="w-8 h-8 text-primary-600" />
                                            </motion.div>
                                        </div>
                                        <p className="text-secondary-500 dark:text-secondary-400 font-medium animate-pulse">Generating Secure QR...</p>
                                    </div>
                                )}

                                {step === "qr" && transaction && (
                                    <div className="flex flex-col items-center mt-6 space-y-6 animate-fade-in">
                                        <div className="bg-white dark:bg-secondary-800 p-4 rounded-2xl shadow-inner border border-secondary-100 dark:border-secondary-700">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src="/images/instapay-qr.png"
                                                alt="InstaPay QR Code"
                                                className="w-48 h-48 object-contain rounded-lg"
                                            />
                                        </div>

                                        <div className="text-center space-y-2">
                                            <p className="text-sm text-secondary-800 dark:text-secondary-100 font-bold">InstaPay Payment</p>
                                            <p className="text-xs text-secondary-500 dark:text-secondary-400">Scan to complete your donation</p>
                                            <div className="flex items-center justify-center gap-2 text-xs font-mono bg-secondary-50 dark:bg-secondary-800 px-3 py-1 rounded-full text-secondary-600 dark:text-secondary-300">
                                                Ref: {transaction.referenceNumber}
                                                <Copy className="w-3 h-3 cursor-pointer hover:text-primary-600" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-3 py-2">
                                            <div className="flex space-x-1.5">
                                                {[0, 1, 2].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-2 h-2 bg-primary-500 rounded-full"
                                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest text-primary-600">Waiting for payment...</p>
                                        </div>

                                        <button
                                            className="text-secondary-400 dark:text-secondary-500 text-sm hover:text-secondary-600 dark:hover:text-secondary-300 underline"
                                            onClick={() => setStep("details")}
                                        >
                                            Cancel
                                        </button>

                                        {/* Auto-confirm after 5 seconds */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            onViewportEnter={() => {
                                                console.log("Setting auto-confirm timeout...");
                                                setTimeout(handleConfirmPayment, 5000);
                                            }}
                                        />
                                    </div>
                                )}

                                {step === "verifying" && (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-6">
                                        {/* Custom Verifying Animation */}
                                        <div className="flex space-x-2">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-4 h-4 bg-primary-500 rounded-full"
                                                    animate={{
                                                        y: [0, -15, 0],
                                                        opacity: [0.5, 1, 0.5]
                                                    }}
                                                    transition={{
                                                        duration: 1,
                                                        repeat: Infinity,
                                                        delay: i * 0.2,
                                                        ease: "easeInOut"
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-secondary-600 dark:text-secondary-400 font-medium">Verifying Transaction...</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </Dialog>
            )}
        </AnimatePresence>
    );
}

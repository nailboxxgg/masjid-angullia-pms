"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Copy, AlertCircle, Smartphone } from "lucide-react";
import { generateQRPh, checkPaymentStatus, QRPhTransaction } from "@/lib/instapay";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
            const result = await generateQRPh(Number(amount), `Donation to ${fundName}`);
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
            const status = await checkPaymentStatus(transaction.referenceNumber);

            if (status === "completed") {
                // Map fund name to Donation Type
                let donationType: Donation['type'] = 'General';
                const lowerFund = fundName.toLowerCase();
                if (lowerFund.includes('education')) donationType = 'Education';
                else if (lowerFund.includes('ramadan') || lowerFund.includes('iftar')) donationType = 'Sadaqah';
                else if (lowerFund.includes('construction') || lowerFund.includes('mosque')) donationType = 'Construction';
                else if (lowerFund.includes('zakat')) donationType = 'Zakat';

                await addDonation({
                    amount: transaction.amount,
                    donorName: donorName || "Anonymous",
                    email: "", // Optional, not collected in this modal version
                    type: donationType,
                    date: Date.now(),
                    status: 'completed',
                    paymentMethod: 'qr_ph',
                    referenceNumber: transaction.referenceNumber,
                    isAnonymous: !donorName,
                    message: `Donation to ${fundName}`
                });

                router.push("/donations/success");
            } else {
                router.push("/donations/failed");
            }
        } catch (error) {
            console.error("Donation processing error:", error);
            router.push("/donations/failed");
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
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
                        >
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8">
                                <h3 className="text-xl font-bold text-center mb-1 text-gray-900 font-heading">
                                    Donate to {fundName}
                                </h3>

                                {step === "details" && (
                                    <form onSubmit={handleGenerateQR} className="space-y-6 mt-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-lg font-semibold text-secondary-800"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Name (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={donorName}
                                                    onChange={(e) => setDonorName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-800"
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
                                        <p className="text-gray-500 font-medium animate-pulse">Generating Secure QR...</p>
                                    </div>
                                )}

                                {step === "qr" && transaction && (
                                    <div className="flex flex-col items-center mt-6 space-y-6 animate-fade-in">
                                        <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={transaction.qrCodeUrl}
                                                alt="QR Ph Code"
                                                className="w-48 h-48 object-contain rounded-lg"
                                            />
                                        </div>

                                        <div className="text-center space-y-2">
                                            <p className="text-sm text-gray-500">Scan via Any Bank App or E-Wallet</p>
                                            <div className="flex items-center justify-center gap-2 text-xs font-mono bg-gray-50 px-3 py-1 rounded-full text-gray-600">
                                                Ref: {transaction.referenceNumber}
                                                <Copy className="w-3 h-3 cursor-pointer hover:text-primary-600" />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleConfirmPayment}
                                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-5 h-5" />
                                            I Have Completed Payment
                                        </button>
                                        <button
                                            className="text-gray-400 text-sm hover:text-gray-600 underline"
                                            onClick={() => setStep("details")}
                                        >
                                            Cancel
                                        </button>
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
                                        <p className="text-gray-600 font-medium">Verifying Transaction...</p>
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

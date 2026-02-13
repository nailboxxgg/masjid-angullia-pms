"use client";

import { useState } from "react";
import { Building, QrCode, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSource } from "@/lib/paymongo"; // We just created this

interface DonationFormProps {
    className?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const AMOUNTS = [100, 500, 1000, 5000];

export default function DonationForm({ className, onSuccess, onCancel }: DonationFormProps) {
    const [amount, setAmount] = useState<number | "">("");
    const [method, setMethod] = useState<"gcash" | "paymaya" | "bpi" | "bdo" | "qr">("gcash");
    const [loading, setLoading] = useState(false);

    const handleDonate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        setLoading(true);
        try {
            // Mock integration
            if (method === "gcash" || method === "paymaya") {
                const response = await createSource(Number(amount), method);
                const url = response.data.attributes.redirect.checkout_url;
                console.log("Redirecting to:", url);
                // In real app: window.location.href = url;
                alert("This would redirect to PayMongo Checkout: " + url);
            } else {
                alert(`Selected ${method.toUpperCase()} payment for ₱${amount}. Redirecting to bank login...`);
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error("Payment failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleDonate} className={cn("space-y-6", className)}>
            <div className="space-y-3">
                <label className="text-sm font-medium text-secondary-700">Select Amount (PHP)</label>
                <div className="grid grid-cols-4 gap-2">
                    {AMOUNTS.map((amt) => (
                        <button
                            key={amt}
                            type="button"
                            onClick={() => setAmount(amt)}
                            className={cn(
                                "py-2 rounded-md text-sm font-medium border transition-all",
                                amount === amt
                                    ? "bg-primary-50 border-primary-500 text-primary-700"
                                    : "bg-white border-secondary-200 text-secondary-600 hover:border-primary-300"
                            )}
                        >
                            ₱{amt}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-secondary-500 font-medium">₱</span>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        placeholder="Enter custom amount"
                        className="flex h-11 w-full rounded-md border border-secondary-300 bg-white pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium text-secondary-700">Payment Method</label>
                <div className="grid grid-cols-1 gap-2">
                    <button
                        type="button"
                        onClick={() => setMethod("gcash")}
                        className={cn(
                            "flex items-center p-3 rounded-lg border transition-all text-left",
                            method === "gcash" ? "border-primary-500 ring-1 ring-primary-500 bg-primary-50" : "border-secondary-200 hover:bg-secondary-50"
                        )}
                    >
                        <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">G</div>
                        <div className="flex-1">
                            <span className="block font-medium text-secondary-900">GCash</span>
                            <span className="text-xs text-secondary-500">Scan QR or login</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMethod("paymaya")}
                        className={cn(
                            "flex items-center p-3 rounded-lg border transition-all text-left",
                            method === "paymaya" ? "border-primary-500 ring-1 ring-primary-500 bg-primary-50" : "border-secondary-200 hover:bg-secondary-50"
                        )}
                    >
                        <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center mr-3">M</div>
                        <div className="flex-1">
                            <span className="block font-medium text-secondary-900">Maya</span>
                            <span className="text-xs text-secondary-500">E-Wallet</span>
                        </div>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setMethod("bpi")}
                            className={cn(
                                "flex items-center p-3 rounded-lg border transition-all text-left",
                                method === "bpi" ? "border-primary-500 ring-1 ring-primary-500 bg-primary-50" : "border-secondary-200 hover:bg-secondary-50"
                            )}
                        >
                            <Building className="h-5 w-5 text-red-700 mr-2" />
                            <span className="font-medium text-secondary-900">BPI</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMethod("bdo")}
                            className={cn(
                                "flex items-center p-3 rounded-lg border transition-all text-left",
                                method === "bdo" ? "border-primary-500 ring-1 ring-primary-500 bg-primary-50" : "border-secondary-200 hover:bg-secondary-50"
                            )}
                        >
                            <Building className="h-5 w-5 text-blue-700 mr-2" />
                            <span className="font-medium text-secondary-900">BDO</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMethod("qr")}
                        className={cn(
                            "flex items-center p-3 rounded-lg border transition-all text-left",
                            method === "qr" ? "border-primary-500 ring-1 ring-primary-500 bg-primary-50" : "border-secondary-200 hover:bg-secondary-50"
                        )}
                    >
                        <div className="h-8 w-8 rounded-full bg-secondary-800 text-white flex items-center justify-center mr-3">
                            <QrCode className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <span className="block font-medium text-secondary-900">QR Ph</span>
                            <span className="text-xs text-secondary-500">Scan with any bank app</span>
                        </div>
                    </button>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-secondary-100">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Donor Information (Optional)</label>
                    <input
                        type="text"
                        placeholder="Your Name (leave blank for anonymous)"
                        className="flex h-11 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                    />
                    <input
                        type="email"
                        placeholder="Email for receipt"
                        className="flex h-11 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !amount}
                className="w-full py-3 bg-primary-600 rounded-lg text-white hover:bg-primary-700 text-base font-semibold flex items-center justify-center shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Processing..." : `Donate ₱${amount || "0"} via PayMongo`}
                {!loading && <ExternalLink className="ml-2 w-4 h-4" />}
            </button>

            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full py-3 bg-white border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 text-base font-semibold transition-all"
                >
                    Cancel
                </button>
            )}

            <p className="text-xs text-center text-secondary-500 flex items-center justify-center gap-1">
                Secured by <span className="font-bold text-secondary-700">PayMongo</span>
            </p>
        </form>
    );
}

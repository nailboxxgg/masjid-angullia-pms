"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Copy, Smartphone, Camera, Check, 
    ArrowLeft, ShieldCheck, QrCode, ExternalLink, RefreshCw 
} from "lucide-react";
import { QRPhTransaction } from "@/lib/instapay";
import { generatePaymentQR, verifyPaymentStatus } from "@/app/actions/donations";
import { useRouter } from "next/navigation";

import { addDonation } from "@/lib/donations";
import { Donation } from "@/lib/types";
import { auth } from "@/lib/firebase";
import { getMemberProfile } from "@/lib/members";
import { formatCurrency } from "@/lib/utils";
import { createSource } from "@/lib/paymongo";

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
    fundName: string;
}

const MAX_DONATION_AMOUNT = 100000;
const MOSQUE_GCASH_NUMBER = "0956 975 8713";
const MOSQUE_GCASH_CLEAN = "09569758713";
const MOSQUE_GCASH_NAME = "MASJID ANGULLIA INC.";

type DonationStep = 
    | "details" 
    | "method_selection" 
    | "gcash_verification" 
    | "gcash_scanner" 
    | "gcash_transfer" 
    | "loading" 
    | "qr" 
    | "verifying";

export default function DonationModal({ isOpen, onClose, fundName }: DonationModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<DonationStep>("details");
    const [amount, setAmount] = useState<string>("");
    const [donorName, setDonorName] = useState("");
    const [amountError, setAmountError] = useState("");
    const [transaction, setTransaction] = useState<QRPhTransaction | null>(null);
    const [member, setMember] = useState<{ uid: string; email: string; displayName: string } | null>(null);

    // GCash Specific State
    const [gcashMethod, setGcashMethod] = useState<"type" | "scan" | null>(null);
    const [typedGcashNumber, setTypedGcashNumber] = useState("");
    const [gcashValidationError, setGcashValidationError] = useState("");
    const [copiedNumber, setCopiedNumber] = useState(false);
    const [copiedRef, setCopiedRef] = useState(false);
    const [gcashReference, setGcashReference] = useState("");
    const [referenceError, setReferenceError] = useState("");
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);

    // Camera/Video Scanner Refs & States
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const currentUser = auth.currentUser;
        if (!currentUser) return;

        getMemberProfile(currentUser.uid)
            .then((profile) => {
                if (!profile) return;
                setMember({ uid: profile.uid, email: profile.email, displayName: profile.displayName });
                
                const prefs = profile.donationPreferences;
                if (prefs) {
                    setDonorName(prefs.defaultIsAnonymous ? "" : (prefs.name || profile.displayName));
                } else {
                    setDonorName((current) => current || profile.displayName);
                }
            })
            .catch((error) => console.error("Failed to load member donation details:", error));
    }, [isOpen]);

    // Handle closing and clean up stream
    const handleClose = () => {
        stopCamera();
        // Reset states
        setStep("details");
        setAmount("");
        setAmountError("");
        setTypedGcashNumber("");
        setGcashReference("");
        setGcashValidationError("");
        setReferenceError("");
        onClose();
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsScanning(false);
    };

    const startCamera = async () => {
        setCameraError(null);
        setIsScanning(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Simulate parsing the QR code after 2.5 seconds of "active scanning"
            setTimeout(() => {
                if (stream.active) {
                    handleQRScanSuccess();
                }
            }, 2500);
        } catch (err) {
            console.error("Failed to access back camera:", err);
            setCameraError("Camera access denied or unsupported on this device. You can use direct typing or click Simulate below.");
        }
    };

    const handleQRScanSuccess = () => {
        stopCamera();
        setStep("gcash_transfer");
    };

    const handleMethodSelect = (method: "qr_ph" | "gcash") => {
        const donationAmount = Number(amount);
        if (!amount || isNaN(donationAmount) || donationAmount <= 0) {
            setAmountError("Please enter a valid amount.");
            return;
        }

        if (method === "qr_ph") {
            handleGenerateQR();
        } else {
            setStep("gcash_verification");
        }
    };

    const handleGenerateQR = async () => {
        const donationAmount = Number(amount);
        setStep("loading");
        try {
            const result = await generatePaymentQR(donationAmount, `Donation to ${fundName}`);
            setTransaction(result);
            setStep("qr");
        } catch (error) {
            console.error("Failed to generate QR", error);
            setStep("details");
        }
    };

    const handleVerifyGcashNumberInput = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanTyped = typedGcashNumber.replace(/[\s-]/g, "");
        if (cleanTyped === MOSQUE_GCASH_CLEAN) {
            setGcashValidationError("");
            setStep("gcash_transfer");
        } else {
            setGcashValidationError("Incorrect GCash Number. Please verify and try again.");
        }
    };

    const copyToClipboard = (text: string, type: "number" | "ref") => {
        navigator.clipboard.writeText(text);
        if (type === "number") {
            setCopiedNumber(true);
            setTimeout(() => setCopiedNumber(false), 2000);
        } else {
            setCopiedRef(true);
            setTimeout(() => setCopiedRef(false), 2000);
        }
    };

    // Automated PayMongo Checkout Option
    const handlePayMongoCheckout = async () => {
        const donationAmount = Number(amount);
        setStep("loading");
        try {
            const response = await createSource(donationAmount, "gcash");
            const checkoutUrl = response.data.attributes.redirect.checkout_url;
            
            // Map fund name to Donation Type
            let donationType: Donation['type'] = 'General';
            const lowerFund = fundName.toLowerCase();
            if (lowerFund.includes('education')) donationType = 'Education';
            else if (lowerFund.includes('meals')) donationType = 'General Donation';
            else if (lowerFund.includes('construction') || lowerFund.includes('mosque')) donationType = 'Construction';
            else if (lowerFund.includes('welfare')) donationType = 'Community Welfare';

            // Add donation as pending
            await addDonation({
                amount: donationAmount,
                donorName: donorName || "Anonymous",
                type: donationType,
                date: Date.now(),
                status: 'pending',
                paymentMethod: 'gcash',
                referenceNumber: response.data.id,
                isAnonymous: !donorName,
                message: `PayMongo GCash: Donation to ${fundName}`,
                memberId: member?.uid,
                donorEmail: member?.email,
            });

            // Redirect to PayMongo
            window.location.href = checkoutUrl;
        } catch (error) {
            console.error("PayMongo initialization failed:", error);
            setStep("gcash_transfer");
            setReferenceError("Failed to initiate PayMongo checkout. Please use the manual transfer option.");
        }
    };

    // Manual reference entry submission
    const handleManualGcashSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gcashReference || gcashReference.trim().length < 8) {
            setReferenceError("Please enter a valid GCash Reference Number.");
            return;
        }

        setIsSubmittingManual(true);
        try {
            let donationType: Donation['type'] = 'General';
            const lowerFund = fundName.toLowerCase();
            if (lowerFund.includes('education')) donationType = 'Education';
            else if (lowerFund.includes('meals')) donationType = 'General Donation';
            else if (lowerFund.includes('construction') || lowerFund.includes('mosque')) donationType = 'Construction';
            else if (lowerFund.includes('welfare')) donationType = 'Community Welfare';

            await addDonation({
                amount: Number(amount),
                donorName: donorName || "Anonymous",
                type: donationType,
                date: Date.now(),
                status: 'pending', // Pending admin approval
                paymentMethod: 'gcash',
                referenceNumber: gcashReference,
                isAnonymous: !donorName,
                message: `Direct GCash: Donation to ${fundName}`,
                memberId: member?.uid,
                donorEmail: member?.email,
            });

            setIsSubmittingManual(false);
            router.push("/donations/success");
        } catch (error) {
            console.error("Failed to submit manual donation:", error);
            setReferenceError("Error processing request. Please try again.");
            setIsSubmittingManual(false);
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
                    message: `Donation to ${fundName}`,
                    memberId: member?.uid,
                    donorEmail: member?.email,
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
                <Dialog static open={isOpen} onClose={handleClose} className="relative z-50">
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
                                onClick={handleClose}
                                className="absolute top-4 right-4 text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors z-10 p-1.5 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8">
                                <h3 className="text-xl font-bold text-center mb-1 text-secondary-900 dark:text-secondary-100 font-heading">
                                    Donate to {fundName}
                                </h3>

                                {step === "details" && (
                                    <form 
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const val = Number(amount);
                                            if (!amount || isNaN(val) || val <= 0) {
                                                setAmountError("Please enter a valid amount.");
                                                return;
                                            }
                                            if (val > MAX_DONATION_AMOUNT) {
                                                setAmountError(`Maximum amount is ${formatCurrency(MAX_DONATION_AMOUNT)}.`);
                                                return;
                                            }
                                            setStep("method_selection");
                                        }} 
                                        className="space-y-6 mt-6 animate-fadeIn"
                                    >
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-1">Amount (₱)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    max={MAX_DONATION_AMOUNT}
                                                    value={amount}
                                                    onChange={(e) => {
                                                        setAmount(e.target.value);
                                                        setAmountError("");
                                                    }}
                                                    className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-lg font-semibold text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 dark:placeholder:text-secondary-500"
                                                    placeholder="0.00"
                                                />
                                                <p className="mt-1 text-xs font-medium text-secondary-500 dark:text-secondary-400">
                                                    Maximum donation: {formatCurrency(MAX_DONATION_AMOUNT)}
                                                </p>
                                                {amountError && (
                                                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-950/30 dark:text-red-300">
                                                        {amountError}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-1">Donor Name (Optional)</label>
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
                                            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-600/30 transition-all transform hover:-translate-y-0.5"
                                        >
                                            Continue to Payment Method
                                        </button>
                                    </form>
                                )}

                                {step === "method_selection" && (
                                    <div className="space-y-4 mt-6 animate-fadeIn">
                                        <p className="text-sm text-secondary-500 text-center font-medium">Select your preferred way to send ₱{Number(amount).toLocaleString()}</p>
                                        
                                        <button
                                            onClick={() => handleMethodSelect("qr_ph")}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-md text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
                                                    <QrCode className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-secondary-900 dark:text-secondary-100">InstaPay QR Ph</span>
                                                    <span className="text-xs text-secondary-500">Scan automatic QR to complete</span>
                                                </div>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-secondary-400 group-hover:text-primary-500 transition-colors" />
                                        </button>

                                        <button
                                            onClick={() => handleMethodSelect("gcash")}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-md text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                                                    <Smartphone className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-secondary-900 dark:text-secondary-100">GCash E-Wallet</span>
                                                    <span className="text-xs text-secondary-500">Manual input, Camera Scan or PayMongo Checkout</span>
                                                </div>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-secondary-400 group-hover:text-primary-500 transition-colors" />
                                        </button>

                                        <button
                                            onClick={() => setStep("details")}
                                            className="w-full text-center text-xs font-semibold text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 py-2 flex items-center justify-center gap-1.5"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" /> Back to details
                                        </button>
                                    </div>
                                )}

                                {step === "gcash_verification" && (
                                    <div className="space-y-6 mt-6 animate-fadeIn">
                                        <div className="text-center space-y-1.5">
                                            <div className="inline-flex p-3 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-500 mb-2">
                                                <ShieldCheck className="w-8 h-8" />
                                            </div>
                                            <h4 className="font-bold text-secondary-900 dark:text-white">Security Verification</h4>
                                            <p className="text-xs text-secondary-500 max-w-xs mx-auto">
                                                To ensure correct transfer, please verify the Mosque's GCash details by either manually entering the account number or scanning the QR code.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => {
                                                    setGcashMethod("type");
                                                    setTypedGcashNumber("");
                                                }}
                                                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center ${
                                                    gcashMethod === "type"
                                                        ? "border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 text-primary-600"
                                                        : "border-secondary-200 dark:border-secondary-800 text-secondary-600 hover:bg-secondary-50"
                                                }`}
                                            >
                                                Type Number
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setGcashMethod("scan");
                                                    setStep("gcash_scanner");
                                                    startCamera();
                                                }}
                                                className="py-3 px-4 rounded-xl border border-secondary-200 dark:border-secondary-800 text-xs font-bold text-secondary-600 hover:bg-secondary-50 transition-all text-center flex items-center justify-center gap-2"
                                            >
                                                <Camera className="w-4 h-4" /> Scan QR Code
                                            </button>
                                        </div>

                                        {gcashMethod === "type" && (
                                            <form onSubmit={handleVerifyGcashNumberInput} className="space-y-4 pt-2">
                                                <div>
                                                    <label className="block text-xs font-semibold text-secondary-500 mb-1">Enter Mosque's GCash Number</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="e.g. 0956 975 8713"
                                                        value={typedGcashNumber}
                                                        onChange={(e) => {
                                                            setTypedGcashNumber(e.target.value);
                                                            setGcashValidationError("");
                                                        }}
                                                        className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 text-center font-mono text-base tracking-widest"
                                                    />
                                                    {gcashValidationError && (
                                                        <p className="mt-2 text-xs font-semibold text-red-500 text-center bg-red-50 dark:bg-red-950/20 p-2 rounded-lg">
                                                            {gcashValidationError}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md transition-all"
                                                >
                                                    Verify & Continue
                                                </button>
                                            </form>
                                        )}

                                        <button
                                            onClick={() => setStep("method_selection")}
                                            className="w-full text-center text-xs font-semibold text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 py-1 flex items-center justify-center gap-1.5"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" /> Back to methods
                                        </button>
                                    </div>
                                )}

                                {step === "gcash_scanner" && (
                                    <div className="space-y-6 mt-6 animate-fadeIn flex flex-col items-center">
                                        <div className="text-center space-y-1">
                                            <h4 className="font-bold text-secondary-900 dark:text-white">GCash Camera Scanner</h4>
                                            <p className="text-xs text-secondary-500">Position the Mosque's GCash QR code inside the frame</p>
                                        </div>

                                        <div className="relative w-64 h-64 bg-black rounded-2xl overflow-hidden border border-secondary-200 dark:border-secondary-800 flex items-center justify-center">
                                            {isScanning && !cameraError && (
                                                <video 
                                                    ref={videoRef} 
                                                    autoPlay 
                                                    playsInline 
                                                    className="w-full h-full object-cover"
                                                />
                                            )}

                                            {/* Camera permission/error state */}
                                            {cameraError && (
                                                <div className="p-4 text-center text-xs text-secondary-400 space-y-2">
                                                    <Camera className="w-8 h-8 mx-auto text-secondary-600 opacity-60" />
                                                    <p>{cameraError}</p>
                                                </div>
                                            )}

                                            {/* Beautiful scanning overlay laser line */}
                                            {isScanning && (
                                                <div className="absolute inset-0 border-2 border-primary-500/30 rounded-2xl flex items-center justify-center">
                                                    <div className="w-48 h-48 border-2 border-dashed border-primary-500/70 rounded-xl relative">
                                                        <motion.div 
                                                            className="absolute left-0 w-full h-0.5 bg-primary-500 shadow-md shadow-primary-500/80"
                                                            animate={{ top: ["5%", "95%", "5%"] }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2.5 w-full">
                                            <button
                                                onClick={() => {
                                                    stopCamera();
                                                    handleQRScanSuccess();
                                                }}
                                                className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Simulate Scan
                                            </button>
                                            <button
                                                onClick={() => {
                                                    stopCamera();
                                                    setStep("gcash_verification");
                                                }}
                                                className="py-3 px-4 border border-secondary-200 dark:border-secondary-800 text-secondary-600 hover:bg-secondary-50 rounded-xl text-xs font-bold transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === "gcash_transfer" && (
                                    <div className="space-y-6 mt-6 animate-fadeIn">
                                        <div className="bg-secondary-50 dark:bg-secondary-900/50 p-5 rounded-2xl border border-secondary-100 dark:border-secondary-800 space-y-3.5 relative overflow-hidden">
                                            <div className="absolute -top-3 -right-3 w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                                                <Smartphone className="w-6 h-6 rotate-12" />
                                            </div>
                                            
                                            <div className="space-y-0.5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary-400">GCash Account Name</span>
                                                <span className="block text-sm font-black text-secondary-900 dark:text-white uppercase">{MOSQUE_GCASH_NAME}</span>
                                            </div>

                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary-400 block">GCash Transfer Number</span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xl font-bold font-mono tracking-wider text-primary-600 dark:text-primary-400">{MOSQUE_GCASH_NUMBER}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(MOSQUE_GCASH_CLEAN, "number")}
                                                        className="p-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 hover:border-primary-500 rounded-xl transition-all relative flex items-center justify-center text-secondary-500 hover:text-primary-500"
                                                        title="Copy Number"
                                                    >
                                                        {copiedNumber ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="text-xs font-black uppercase tracking-widest text-secondary-400 text-center">Payment Methods</h5>
                                            
                                            {/* PayMongo Option */}
                                            <button
                                                onClick={handlePayMongoCheckout}
                                                className="w-full flex items-center justify-between p-4 rounded-xl border border-blue-200 dark:border-blue-900/30 bg-blue-50/20 hover:bg-blue-50/40 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 text-left transition-all hover:shadow-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                    <div>
                                                        <span className="block text-xs font-bold text-secondary-900 dark:text-white">Pay via PayMongo E-Wallet (Easy)</span>
                                                        <span className="text-[10px] text-secondary-500">Auto-redirect and Instant Verification</span>
                                                    </div>
                                                </div>
                                                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                                            </button>

                                            {/* Manual Reference Entry */}
                                            <div className="border border-secondary-200 dark:border-secondary-800 rounded-xl p-4 space-y-4">
                                                <div className="text-xs text-secondary-500 text-center font-medium">
                                                    Or transfer directly in your GCash App and submit the reference number below
                                                </div>

                                                <form onSubmit={handleManualGcashSubmit} className="space-y-3">
                                                    <div>
                                                        <label className="block text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-1">13-digit Reference Number</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="e.g. 5013 9081 2345"
                                                            value={gcashReference}
                                                            onChange={(e) => {
                                                                setGcashReference(e.target.value);
                                                                setReferenceError("");
                                                            }}
                                                            className="w-full px-4 py-2 text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 text-center font-mono"
                                                        />
                                                        {referenceError && (
                                                            <p className="mt-1.5 text-xs text-red-500 text-center">{referenceError}</p>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        disabled={isSubmittingManual}
                                                        className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                    >
                                                        {isSubmittingManual ? "Submitting..." : "Submit Manual Reference"}
                                                    </button>
                                                </form>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setStep("gcash_verification")}
                                            className="w-full text-center text-xs font-semibold text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 py-1 flex items-center justify-center gap-1.5"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                                        </button>
                                    </div>
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
                                        <p className="text-secondary-500 dark:text-secondary-400 font-medium animate-pulse">Generating Secure Connection...</p>
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
                                            onClick={() => setStep("method_selection")}
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

"use client";

import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function DonationSuccessPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </motion.div>

                <h1 className="text-3xl font-bold font-heading text-gray-900 mb-2">Donation Received!</h1>
                <p className="text-gray-600 mb-8">
                    JazakAllah Khair for your generous support! Your contribution has been successfully processed and will help us serve our community better.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/donations"
                        className="block w-full py-3 bg-secondary-100 text-secondary-900 font-bold rounded-xl hover:bg-secondary-200 transition-colors"
                    >
                        Make Another Donation
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary-50 text-secondary-600 border border-secondary-100 hover:bg-secondary-100 transition-all text-sm font-bold group justify-center w-full"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

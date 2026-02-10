"use client";

import Link from "next/link";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function DonationFailedPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <AlertCircle className="w-12 h-12 text-red-600" />
                </motion.div>

                <h1 className="text-3xl font-bold font-heading text-gray-900 mb-2">Payment Failed</h1>
                <p className="text-gray-600 mb-8">
                    We couldn&apos;t verify your transaction. This might be due to a timeout or connection issue. Please try again.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/donations"
                        className="block w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Try Again
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-secondary-50 text-secondary-600 border border-secondary-100 hover:bg-secondary-100 transition-all text-sm font-bold group w-full"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { Lock, Bell } from "lucide-react";
import { useState } from "react";
import SubscriptionModal from "@/components/ui/SubscriptionModal";

interface FooterProps {
    onAdminClick?: () => void;
}

export default function Footer({ onAdminClick }: FooterProps) {
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);

    return (
        <>
            <footer className="py-12 bg-secondary-900 text-secondary-400 text-sm border-t border-secondary-800">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
                    <div>
                        <h4 className="text-white font-bold mb-4">Masjid Angullia</h4>
                        <p className="text-secondary-500 leading-relaxed max-w-xs mx-auto md:mx-0">
                            Serving the community with faith, charity, and unity.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Quick Links</h4>
                        <div className="flex flex-col gap-2">
                            <Link href="/donations" className="hover:text-primary-400 transition-colors">Donate</Link>
                            <Link href="#" className="hover:text-primary-400 transition-colors">Events</Link>
                            <Link href="/feedback" className="hover:text-primary-400 transition-colors">Concerns, Feedbacks, and Request</Link>
                        </div>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <h4 className="text-white font-bold mb-4">Stay Connected</h4>
                        <button
                            onClick={() => setIsSubModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all shadow-lg hover:shadow-primary-600/20"
                        >
                            <Bell className="w-4 h-4" />
                            <span>Get SMS Updates</span>
                        </button>
                    </div>
                </div>

                <div className="pt-8 border-t border-secondary-800 text-center">
                    <p>&copy; {new Date().getFullYear()} Masjid Angullia. All rights reserved.</p>
                    <div className="mt-4 flex justify-center gap-4">
                        <Link href="/" className="hover:text-white transition-colors">Term of Use</Link>
                        <Link href="/" className="hover:text-white transition-colors">Privacy Policy</Link>
                    </div>

                    {onAdminClick && (
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={onAdminClick}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-800/50 text-secondary-500 hover:bg-secondary-800 hover:text-secondary-300 transition-all text-xs font-medium border border-secondary-800 hover:border-secondary-700"
                            >
                                <Lock className="w-3 h-3" />
                                <span>Staff Access</span>
                            </button>
                        </div>
                    )}
                </div>
            </footer>

            <SubscriptionModal
                isOpen={isSubModalOpen}
                onClose={() => setIsSubModalOpen(false)}
            />
        </>
    );
}

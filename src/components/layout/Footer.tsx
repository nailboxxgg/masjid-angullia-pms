"use client";

import Link from "next/link";
import { Lock, Bell } from "lucide-react";
import { useState } from "react";
import SubscriptionModal from "@/components/ui/SubscriptionModal";

interface FooterProps {
    onAdminClick?: () => void;
    onFeedbackClick?: () => void;
}

export default function Footer({ onAdminClick, onFeedbackClick }: FooterProps) {
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);

    return (
        <>
            <footer className="py-8 md:py-12 bg-secondary-900 text-secondary-400 text-sm border-t border-secondary-800">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
                    <div>
                        <h4 className="text-white font-bold mb-4">Masjid Angullia</h4>
                        <p className="text-secondary-500 leading-relaxed max-w-xs mx-auto md:mx-0">
                            Serving the community with faith, charity, and unity.
                        </p>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <h4 className="text-white font-bold mb-4">Quick Links</h4>
                        <div className="flex flex-col gap-2 items-center md:items-start">
                            <Link href="/donations" className="hover:text-primary-400 transition-colors">Donate</Link>
                            <button
                                onClick={() => {
                                    if (onFeedbackClick) {
                                        onFeedbackClick();
                                    } else {
                                        window.dispatchEvent(new CustomEvent('open-feedback-modal'));
                                    }
                                }}
                                className="text-center md:text-left hover:text-primary-400 transition-colors focus:outline-none"
                            >
                                Concerns, Feedbacks, and Request
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <h4 className="text-white font-bold mb-4">Contact Info</h4>
                        <div className="flex flex-col gap-3 text-secondary-500 text-xs">
                            <p>Brgy. Pogo, Alaminos City, Pangasinan</p>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-secondary-800 text-center">
                    <p>&copy; {new Date().getFullYear()} Masjid Angullia. All rights reserved.</p>



                </div>
            </footer>

            <SubscriptionModal
                isOpen={isSubModalOpen}
                onClose={() => setIsSubModalOpen(false)}
            />
        </>
    );
}

"use client";

import dynamic from "next/dynamic";
import FamilyRegistrationForm from "./FamilyRegistrationForm";

const Modal = dynamic(() => import("@/components/ui/modal"), { ssr: false });

interface FamilyRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FamilyRegistrationModal({ isOpen, onClose }: FamilyRegistrationModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Family Registration"
            className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl"
            hideScrollbar={true}
        >
            <div className="p-6 md:p-8 bg-white dark:bg-secondary-900">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-secondary-900 dark:text-white font-heading tracking-tight mb-2">
                        Join Our Community
                    </h2>
                    <p className="text-secondary-500 dark:text-secondary-400 text-base leading-relaxed">
                        Register your family to stay connected, receive updates, and be part of the Masjid Angullia jama&apos;ah directory.
                    </p>
                </div>

                <FamilyRegistrationForm onSuccess={onClose} />
            </div>
        </Modal>
    );
}

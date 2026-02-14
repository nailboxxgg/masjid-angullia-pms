"use client";

import dynamic from "next/dynamic";
import FeedbackForm from "./FeedbackForm";

const Modal = dynamic(() => import("@/components/ui/modal"), { ssr: false });

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Community Feedback"
            className="max-w-xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl"
            hideScrollbar={true}
        >
            <div className="p-4 sm:p-6 bg-white dark:bg-secondary-900">
                <div className="mb-8 text-center px-4">
                    <p className="text-secondary-500 dark:text-secondary-400 mt-1 font-medium italic underline underline-offset-4 decoration-primary-500/30">
                        Help us improve your mosque experience.
                    </p>
                </div>
                <FeedbackForm onSuccess={onClose} />
            </div>
        </Modal>
    );
}

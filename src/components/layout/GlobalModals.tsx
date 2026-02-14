"use client";

import { useState, useEffect } from "react";
import FeedbackModal from "@/components/modules/FeedbackModal";

export default function GlobalModals() {
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    useEffect(() => {
        const handleOpenFeedback = () => setIsFeedbackOpen(true);
        window.addEventListener('open-feedback-modal', handleOpenFeedback);

        return () => {
            window.removeEventListener('open-feedback-modal', handleOpenFeedback);
        };
    }, []);

    return (
        <>
            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />
        </>
    );
}

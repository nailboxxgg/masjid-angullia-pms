"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative w-full max-w-lg transform rounded-xl bg-white p-6 shadow-2xl transition-all animate-slide-up border border-secondary-100 dark:bg-secondary-900 dark:border-secondary-800",
                    className
                )}
            >
                <div className="flex items-center justify-between mb-4 border-b border-secondary-100 pb-4 dark:border-secondary-800">
                    {title && <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">{title}</h3>}
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-500 transition-colors dark:hover:bg-secondary-800"
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto pr-1">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

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
    hideScrollbar?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, className, hideScrollbar }: ModalProps) {
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
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative w-full max-w-lg transform rounded-xl bg-white p-4 sm:p-6 shadow-2xl transition-all animate-slide-up border border-secondary-100/50 dark:bg-secondary-900 dark:border-secondary-800 ring-1 ring-black/5",
                    className
                )}
            >
                <div className="flex items-center justify-between mb-3 sm:mb-5 pb-0">
                    {title && <h3 className="text-lg font-heading font-semibold text-secondary-900 dark:text-secondary-100">{title}</h3>}
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 bg-secondary-50 dark:bg-secondary-800 text-secondary-400 dark:text-secondary-500 hover:bg-secondary-100 hover:text-secondary-600 dark:hover:bg-secondary-700 dark:hover:text-secondary-300 transition-colors"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                <div className={cn(
                    "max-h-[80vh] overflow-y-auto pr-1",
                    hideScrollbar && "no-scrollbar"
                )}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

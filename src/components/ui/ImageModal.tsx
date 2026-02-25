"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    src: string;
    alt: string;
}

export default function ImageModal({ isOpen, onClose, src, alt }: ImageModalProps) {
    const mounted = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8 md:p-12 animate-fade-in">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-[110] p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95 group"
            >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Image Container */}
            <div
                className="relative w-full h-full flex items-center justify-center animate-zoom-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative w-full h-full max-w-6xl max-h-full">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-contain"
                        sizes="100vw"
                        priority
                    />
                </div>
            </div>

            {/* Simple Backdrop click to close */}
            <div className="absolute inset-0 z-[-1]" onClick={onClose} />
        </div>,
        document.body
    );
}

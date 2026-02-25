"use client";

import { motion, AnimatePresence, MotionProps } from "framer-motion";
import React from "react";

interface AnimationWrapperProps extends MotionProps {
    children: React.ReactNode;
    className?: string;
    animation?: "fadeIn" | "slideUp" | "slideRight" | "scaleIn" | "reveal";
    delay?: number;
    duration?: number;
    withScroll?: boolean;
}

export default function AnimationWrapper({
    children,
    className = "",
    animation = "reveal",
    delay = 0,
    duration = 0.5,
    withScroll = true,
    ...props
}: AnimationWrapperProps & { withScroll?: boolean }) {
    const mounted = React.useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );

    const variants = {
        fadeIn: {
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
        },
        slideUp: {
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 },
        },
        slideRight: {
            hidden: { opacity: 0, x: -30 },
            visible: { opacity: 1, x: 0 },
        },
        scaleIn: {
            hidden: { opacity: 0, scale: 0.9 },
            visible: { opacity: 1, scale: 1 },
        },
        reveal: {
            hidden: { opacity: 0, y: 50, scale: 0.95, filter: "blur(10px)" },
            visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
        },
    };

    return (
        <motion.div
            initial="hidden"
            animate={!mounted ? "hidden" : (withScroll ? undefined : "visible")}
            whileInView={mounted && withScroll ? "visible" : undefined}
            exit="hidden"
            viewport={withScroll ? { once: true, margin: "-50px" } : undefined}
            variants={variants[animation]}
            transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

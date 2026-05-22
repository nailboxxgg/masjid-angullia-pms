"use client";

import { useEffect, useState } from "react";
import { CloudOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [showReconnected, setShowReconnected] = useState(false);
    const isOffline = !isOnline;

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);
            setTimeout(() => setShowReconnected(false), 3000);
        };
        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
        };

        const syncStatusId = window.setTimeout(() => setIsOnline(navigator.onLine), 0);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.clearTimeout(syncStatusId);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <div className="fixed bottom-4 left-4 z-[100] pointer-events-none">
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="flex items-center gap-3 px-4 py-2 bg-red-600 text-white rounded-full shadow-lg border border-red-500/20 backdrop-blur-sm"
                    >
                        <CloudOff className="w-4 h-4" />
                        <span className="text-sm font-medium">Working Offline</span>
                    </motion.div>
                )}

                {showReconnected && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="flex items-center gap-3 px-4 py-2 bg-green-600 text-white rounded-full shadow-lg border border-green-500/20 backdrop-blur-sm"
                    >
                        <Wifi className="w-4 h-4" />
                        <span className="text-sm font-medium">Back Online</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCcw, AlertTriangle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/modal";
import { auth } from "@/lib/firebase";
import { clockOut } from "@/lib/attendance";

export default function NavigationGuard() {
    const router = useRouter();
    const [modalType, setModalType] = useState<"logout" | "refresh" | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        // 1. Intercept Browser Refresh / Close
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ""; // Required for chrome
            return "";
        };

        // 2. Intercept Back Button
        const handlePopState = (event: PopStateEvent) => {
            // Stop the actual navigation
            window.history.pushState(null, "", window.location.href);
            setModalType("logout");
        };

        // Initialize state for back button interception
        window.history.pushState(null, "", window.location.href);

        // 3. Detect if page was refreshed
        const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
        if (navEntries.length > 0 && navEntries[0].type === "reload") {
            setModalType("refresh");
        }

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState);

        // Special handling for refresh attempt interception from document
        // If the user triggers a refresh but cancels it, we can show our sync modal
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                // Potential check if coming back from a "stay on page" decision
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const confirmSignOut = async () => {
        setIsLoggingOut(true);
        try {
            const user = auth.currentUser;
            if (user) {
                const displayName = user.displayName || user.email?.split("@")[0] || "User";
                try {
                    await clockOut(user.uid, displayName, user.email || "");
                } catch (err) {
                    console.error("Auto clock-out failed:", err);
                }
            }
            await auth.signOut();
            window.location.href = "/";
        } catch (error) {
            console.error("Error signing out:", error);
            setIsLoggingOut(false);
        }
    };

    return (
        <AnimatePresence>
            {modalType && (
                <Modal
                    isOpen={!!modalType}
                    onClose={() => setModalType(null)}
                    showCloseButton={!isLoggingOut}
                    className="max-w-md overflow-hidden p-0 rounded-3xl"
                >
                    <div className="relative">
                        {/* Header Decoration */}
                        <div className={`h-32 w-full ${modalType === 'logout' ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'} flex items-center justify-center`}>
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30"
                            >
                                {modalType === 'logout' ? (
                                    <LogOut className="w-10 h-10 text-white" />
                                ) : (
                                    <RefreshCcw className="w-10 h-10 text-white" />
                                )}
                            </motion.div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-black text-secondary-900 dark:text-white font-heading tracking-tight">
                                    {modalType === 'logout' ? 'Security Notice' : 'Sync Protection'}
                                </h2>
                                <p className="text-secondary-500 dark:text-secondary-400 font-medium">
                                    {modalType === 'logout'
                                        ? 'Attempting to go back will log you out of the admin session for security reasons.'
                                        : 'Refreshing the page may cause unsynced progress to be lost. Would you like to restore/sync now?'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {modalType === 'logout' ? (
                                    <>
                                        <button
                                            onClick={confirmSignOut}
                                            disabled={isLoggingOut}
                                            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 group"
                                        >
                                            {isLoggingOut ? (
                                                <RefreshCcw className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                    Sign Out Securely
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setModalType(null)}
                                            disabled={isLoggingOut}
                                            className="w-full py-4 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 rounded-2xl font-bold hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-all"
                                        >
                                            Stay on Page
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setModalType(null)}
                                            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <RefreshCcw className="w-5 h-5 group-rotate-180 transition-transform duration-500" />
                                            Restore & Sync Progress
                                        </button>
                                        <button
                                            onClick={() => setModalType(null)}
                                            className="w-full py-4 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 rounded-2xl font-bold hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-all"
                                        >
                                            Ignore
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Warning Footer */}
                            <div className="flex items-start gap-3 p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-2xl border border-secondary-100 dark:border-secondary-700">
                                <ShieldAlert className="w-5 h-5 text-secondary-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-400 dark:text-secondary-500 leading-tight">
                                    Always use the sidebar navigation to avoid accidental logouts.
                                </p>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </AnimatePresence>
    );
}

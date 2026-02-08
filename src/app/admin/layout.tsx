"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { startPresenceHeartbeat } from "@/lib/presence";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        let stopHeartbeat: (() => void) | undefined;

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/");
            } else {
                setLoading(false);
                // Start presence tracking when authenticated
                stopHeartbeat = startPresenceHeartbeat();
            }
        });

        // Inactivity Timer Implementation (1 hour)
        const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour
        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                await auth.signOut();
                router.push("/");
            }, INACTIVITY_LIMIT);
        };

        const activityEvents = [
            "mousedown",
            "mousemove",
            "keydown",
            "scroll",
            "touchstart",
            "click"
        ];

        // Initialize timer
        resetTimer();

        // Add event listeners
        activityEvents.forEach((event) => {
            window.addEventListener(event, resetTimer);
        });

        return () => {
            unsubscribe();
            if (stopHeartbeat) stopHeartbeat();
            if (timeoutId) clearTimeout(timeoutId);
            activityEvents.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-secondary-950 transition-colors duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-secondary-950 text-secondary-900 dark:text-secondary-100 transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-secondary-950 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

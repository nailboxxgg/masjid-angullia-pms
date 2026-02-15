"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import NavigationGuard from "@/components/admin/NavigationGuard";
import { startPresenceHeartbeat } from "@/lib/presence";

import { motion, AnimatePresence } from "framer-motion";

import { AdminProvider, useAdmin } from "@/contexts/AdminContext";

function AdminLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { role, loading, user } = useAdmin();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        let stopHeartbeat: (() => void) | undefined;

        if (!loading) {
            if (!user || !role || !['admin', 'staff', 'volunteer', 'employee'].includes(role)) {
                router.push("/");
            } else {
                // Route Protection for Non-Admin roles
                if (role !== 'admin') {
                    const currentPath = window.location.pathname;

                    // Volunteers: ONLY Attendance
                    if (role === 'volunteer') {
                        if (currentPath !== '/admin/attendance') {
                            console.warn(`Volunteer access redirected to attendance from ${currentPath}`);
                            router.push("/admin/attendance");
                        }
                    } else {
                        // Staff: Limited routes
                        const adminOnlyRoutes = [
                            '/admin/families',
                            '/admin/settings',
                            '/admin/feedback',
                            '/admin/feed'
                        ];

                        if (adminOnlyRoutes.some(route => currentPath.startsWith(route))) {
                            console.warn(`Access denied for role ${role} to ${currentPath}`);
                            router.push("/admin");
                        }
                    }
                }

                // User is authorized
                stopHeartbeat = startPresenceHeartbeat();
            }
        }

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
            if (stopHeartbeat) stopHeartbeat();
            if (timeoutId) clearTimeout(timeoutId);
            activityEvents.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [router, user, role, loading]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-secondary-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
        );
    }

    if (!user || !role) return null;

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-secondary-950 text-secondary-900 dark:text-secondary-100">
            {/* Navigation Guards */}
            <NavigationGuard />

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-secondary-50 dark:bg-secondary-950">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="max-w-7xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminProvider>
            <AdminLayoutContent>
                {children}
            </AdminLayoutContent>
        </AdminProvider>
    );
}

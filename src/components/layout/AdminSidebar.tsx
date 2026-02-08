"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    DollarSign,
    Settings,
    LogOut,
    ShieldCheck,
    MessageSquare,
    Megaphone,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";

const adminRoutes = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Feed & Events", href: "/admin/feed", icon: Megaphone },
    { name: "Inbox", href: "/admin/feedback", icon: MessageSquare },
    { name: "Requests", href: "/admin/requests", icon: FileText },
    { name: "Families", href: "/admin/families", icon: Users },
    { name: "Finances", href: "/admin/finances", icon: DollarSign },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter(); // Import useRouter from next/navigation
    const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

    // Handle Sign Out Link Click
    const handleSignOutClick = () => {
        setIsSignOutModalOpen(true);
    };

    // Handle Back Button Intercept
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            // Basic basic interception: if user tries to go back, we stop them and show modal
            event.preventDefault();
            // Since we can't fully block "back", we push the current state again to "stay" on the page
            window.history.pushState(null, "", window.location.href);
            setIsSignOutModalOpen(true);
        };

        // Push a dummy state so there's something to pop
        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    const confirmSignOut = async () => {
        try {
            await auth.signOut();
            window.location.href = "/";
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <>
            <motion.div
                initial={false}
                animate={{
                    x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -256 : 0),
                    opacity: 1
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                    "fixed md:relative flex flex-col h-screen w-64 bg-secondary-900 text-white border-r border-secondary-800 z-50 transition-all duration-300",
                    !isOpen && "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="p-6 flex items-center justify-between border-b border-secondary-800">
                    <div className="flex items-center gap-3">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="bg-primary-500/20 p-2 rounded-lg"
                        >
                            <ShieldCheck className="w-6 h-6 text-primary-500" />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h1 className="font-heading font-bold text-lg tracking-tight">Admin Portal</h1>
                            <p className="text-xs text-secondary-500">Masjid Angullia</p>
                        </motion.div>
                    </div>

                    {/* Close Button Mobile */}
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-secondary-400 hover:text-white md:hidden"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {adminRoutes.map((route, index) => {
                        const Icon = route.icon;
                        const isActive = pathname === route.href;
                        return (
                            <motion.div
                                key={route.href}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + (index * 0.05) }}
                            >
                                <Link
                                    href={route.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative overflow-hidden",
                                        isActive
                                            ? "text-primary-400"
                                            : "text-secondary-400 hover:text-white"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-primary-600/10 rounded-lg"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    {!isActive && (
                                        <div className="absolute inset-0 bg-secondary-800 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                                    )}

                                    <Icon className={cn("w-5 h-5 relative z-10 group-hover:scale-105 transition-transform", isActive ? "text-primary-500" : "text-secondary-500 group-hover:text-white")} />
                                    <span className="relative z-10">{route.name}</span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </nav>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-4 border-t border-secondary-800"
                >
                    <button
                        onClick={handleSignOutClick}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/30 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </motion.div>
            </motion.div>

            {/* Sign Out Confirmation Modal */}
            <Modal
                isOpen={isSignOutModalOpen}
                onClose={() => setIsSignOutModalOpen(false)}
                title="Confirm Sign Out"
                className="max-w-sm bg-white dark:bg-secondary-900"
            >
                <div className="space-y-4">
                    <p className="text-secondary-600 dark:text-secondary-400">
                        Are you sure you want to log out of the admin portal?
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setIsSignOutModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-secondary-600 hover:text-secondary-800 hover:bg-secondary-100 rounded-lg transition-colors dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:bg-secondary-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmSignOut}
                            className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-600/20 transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

"use client";

import { clockOut } from "@/lib/attendance";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Modal from "@/components/ui/modal";
import {
    LayoutDashboard,
    User,
    Users,
    Calendar,
    DollarSign,
    Settings,
    LogOut,
    ShieldCheck,
    MessageSquare,
    Megaphone,
    Clock,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { goOffline } from "@/lib/presence";

const adminRoutes = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Events", href: "/admin/events", icon: Calendar },
    { name: "Announcements", href: "/admin/feed", icon: Megaphone },
    { name: "Inbox", href: "/admin/feedback", icon: MessageSquare },
    { name: "Families", href: "/admin/families", icon: Users },
    { name: "Staff", href: "/admin/staff", icon: User },
    { name: "Requests", href: "/admin/requests", icon: MessageSquare },
    { name: "Finances", href: "/admin/finances", icon: DollarSign },
    { name: "Attendance", href: "/admin/attendance", icon: Clock },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}


export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname();
    const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
    const { unreadCount } = useNotifications();

    // Auto-redirect if trying to access blocked route in sidebar logic? 
    // Handled by layout.tsx already.

    // Handle Sign Out Link Click
    const handleSignOutClick = () => {
        setIsSignOutModalOpen(true);
    };

    const confirmSignOut = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const displayName = user.displayName || user.email?.split('@')[0] || "User";
                try {
                    await goOffline(); // Clear presence status
                    await clockOut(user.uid, displayName, user.email || "");
                } catch (err) {
                    console.error("Logout cleanup failed:", err);
                }
            }
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
                    "fixed md:relative flex flex-col h-screen w-72 bg-white dark:bg-secondary-950 border-r border-secondary-200 dark:border-secondary-800 text-secondary-900 dark:text-secondary-100 z-50",
                    !isOpen && "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="p-6 flex items-center justify-between border-b border-secondary-100 dark:border-secondary-900 bg-secondary-50/30 dark:bg-secondary-900/10">
                    <div className="flex items-center gap-3">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="bg-primary-500/10 dark:bg-primary-500/20 p-2.5 rounded-xl ring-1 ring-primary-500/20 shadow-inner"
                        >
                            <ShieldCheck className="w-6 h-6 text-primary-600 dark:text-primary-500" />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h1 className="font-black text-lg tracking-tight text-secondary-900 dark:text-white uppercase">
                                Admin Portal
                            </h1>
                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">Masjid Angullia</p>
                        </motion.div>
                    </div>

                    {/* Close Button Mobile */}
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-secondary-400 hover:text-rose-600 dark:text-secondary-500 dark:hover:text-rose-400 md:hidden transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-100 dark:scrollbar-thumb-secondary-800">
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
                                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group relative overflow-hidden",
                                        isActive
                                            ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 shadow-sm border border-primary-100/50 dark:border-primary-800/20"
                                            : "text-secondary-500 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-white hover:bg-secondary-50 dark:hover:bg-secondary-900/30 border border-transparent"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-xl transition-all duration-300",
                                        isActive
                                            ? "bg-primary-500/10 dark:bg-primary-500/20"
                                            : "bg-transparent group-hover:bg-secondary-100 dark:group-hover:bg-secondary-800"
                                    )}>
                                        <Icon className={cn("w-4.5 h-4.5 relative z-10 transition-all duration-300", isActive ? "text-primary-600 scale-110" : "text-secondary-400 group-hover:scale-110 group-hover:text-primary-500")} />
                                    </div>
                                    <span className="relative z-10 flex-1">{route.name}</span>
                                    {route.name === "Inbox" && unreadCount > 0 && (
                                        <span className="relative z-10 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[9px] font-black text-white bg-rose-500 rounded-lg shadow-lg shadow-rose-500/20">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </motion.div>
                        );
                    })}
                </nav>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-4 border-t border-secondary-100 dark:border-secondary-900"
                >
                    <Link
                        href="/"
                        target="_blank"
                        className="flex items-center gap-3 px-4 py-3.5 mb-2 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest text-secondary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30"
                    >
                        <div className="p-2 rounded-xl bg-secondary-50 dark:bg-secondary-900 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                            <span className="w-4.5 h-4.5 flex items-center justify-center text-lg">🌐</span>
                        </div>
                        View Live Site
                    </Link>

                    <button
                        onClick={handleSignOutClick}
                        className="flex items-center gap-3 px-4 py-3.5 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest text-secondary-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                    >
                        <div className="p-2 rounded-xl bg-secondary-50 dark:bg-secondary-900 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50 transition-colors">
                            <LogOut className="w-4.5 h-4.5" />
                        </div>
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

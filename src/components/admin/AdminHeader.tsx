
"use client";

import { useState, useEffect } from "react";
import { AdminPresence, subscribeToActiveAdmins } from "@/lib/presence";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";

import ThemeToggle from "@/components/ui/ThemeToggle";

interface AdminHeaderProps {
    onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    const [activeAdmins, setActiveAdmins] = useState<AdminPresence[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

    useEffect(() => {
        const unsubscribe = subscribeToActiveAdmins((admins) => {
            setActiveAdmins(admins);
        });
        return () => unsubscribe();
    }, []);

    return (
        <header className="h-16 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
            {/* Left: Mobile Menu Toggle & Spacer */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-secondary-900 dark:text-white hover:text-primary-600 md:hidden transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Right: Presence, Notifications & Theme */}
            <div className="flex items-center gap-4">
                {/* Online Admins (Chat Heads) */}
                <div className="flex items-center -space-x-2 mr-2">
                    <AnimatePresence>
                        {activeAdmins.map((admin) => (
                            <motion.div
                                key={admin.uid}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="relative group cursor-pointer"
                                title={`${admin.displayName} (${admin.status})`}
                            >
                                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-secondary-800 bg-primary-100 dark:bg-primary-900 overflow-hidden relative">
                                    {admin.photoURL ? (
                                        <Image src={admin.photoURL} alt={admin.displayName} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300">
                                            {admin.displayName[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-secondary-800 ${admin.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                                    }`}></span>

                                {/* Tooltip */}
                                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                                    {admin.displayName}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {activeAdmins.length === 0 && (
                        <div className="text-xs text-secondary-900 dark:text-secondary-200 font-bold italic pr-2">No other admins online</div>
                    )}
                </div>

                <div className="h-6 w-[1px] bg-secondary-200 dark:bg-secondary-800 mx-1" />

                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotifOpen((prev) => !prev)}
                        className="relative p-2 text-secondary-500 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-white transition-colors rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800"
                    >
                        <Bell className="w-5 h-5" />
                        <AnimatePresence>
                            {unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-black text-white bg-red-500 rounded-full shadow-lg ring-2 ring-white dark:ring-secondary-900"
                                >
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>

                    <NotificationDropdown
                        isOpen={isNotifOpen}
                        onClose={() => setIsNotifOpen(false)}
                        notifications={notifications}
                        onMarkAsRead={markAsRead}
                        onMarkAllRead={markAllRead}
                    />
                </div>

                <ThemeToggle />
            </div>
        </header>
    );
}

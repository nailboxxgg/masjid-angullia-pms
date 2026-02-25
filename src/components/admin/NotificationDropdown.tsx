"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, MessageSquare, AlertTriangle, HelpCircle, Inbox } from "lucide-react";
import { Notification } from "@/hooks/useNotifications";
import { formatTimeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllRead: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const typeConfig: Record<string, { icon: typeof MessageSquare; color: string; label: string }> = {
    Concern: { icon: AlertTriangle, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20", label: "Concern" },
    Feedback: { icon: MessageSquare, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20", label: "Feedback" },
    Request: { icon: HelpCircle, color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20", label: "Request" },
    Message: { icon: MessageSquare, color: "text-green-500 bg-green-50 dark:bg-green-900/20", label: "Message" },
};

export default function NotificationDropdown({
    isOpen,
    onClose,
    notifications,
    onMarkAsRead,
    onMarkAllRead,
    triggerRef
}: NotificationDropdownProps) {
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Ignore click if it's on the trigger button (fixes double-toggle issue)
            if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
                return;
            }

            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    const handleNotificationClick = async (notification: Notification) => {
        await onMarkAsRead(notification.id);
        router.push("/admin/feedback");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="fixed left-4 right-4 top-[4.5rem] md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-96 max-h-[80vh] md:max-h-[480px] bg-white dark:bg-secondary-900 rounded-2xl shadow-3xl md:shadow-2xl border border-secondary-200 dark:border-secondary-800 overflow-hidden z-50 flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-secondary-100 dark:border-secondary-800">
                        <h3 className="text-sm font-black text-secondary-900 dark:text-white tracking-tight">Notifications</h3>
                        {notifications.length > 0 && (
                            <button
                                onClick={onMarkAllRead}
                                className="flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-[380px] no-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-14 h-14 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Inbox className="w-7 h-7 text-secondary-400" />
                                </div>
                                <p className="text-sm font-bold text-secondary-500 dark:text-secondary-400">All caught up!</p>
                                <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">No new notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification, idx) => {
                                const config = typeConfig[notification.type] || typeConfig.Feedback;
                                const Icon = config.icon;

                                return (
                                    <motion.button
                                        key={notification.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="w-full text-left px-5 py-4 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors border-b border-secondary-50 dark:border-secondary-800/50 last:border-b-0 group"
                                    >
                                        <div className="flex gap-3">
                                            {/* Type Icon */}
                                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", config.color)}>
                                                <Icon className="w-4 h-4" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-bold text-secondary-900 dark:text-white truncate">
                                                        {notification.senderName}
                                                    </p>
                                                    <span className="text-[10px] text-secondary-400 dark:text-secondary-500 shrink-0 font-medium">
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", config.color)}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1 line-clamp-2 leading-relaxed">
                                                    {notification.preview}
                                                </p>
                                            </div>

                                            {/* Unread dot */}
                                            <div className="w-2.5 h-2.5 bg-primary-500 rounded-full shrink-0 mt-2 animate-pulse" />
                                        </div>
                                    </motion.button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-secondary-100 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-800/20">
                            <button
                                onClick={() => { router.push("/admin/feedback"); onClose(); }}
                                className="w-full text-center text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                            >
                                View all in Inbox →
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

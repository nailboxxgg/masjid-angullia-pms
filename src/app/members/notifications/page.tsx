"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    Bell,
    BellRing,
    CalendarCheck,
    CheckCheck,
    Loader2,
    Megaphone,
    MessageSquareReply,
    ShieldCheck,
} from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import {
    countUnreadNotifications,
    getMemberNotifications,
    markAllMemberNotificationsRead,
    markMemberNotificationRead,
} from "@/lib/member-notifications";
import { MemberNotification, MemberNotificationType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<MemberNotificationType, React.ComponentType<{ className?: string }>> = {
    event_registration: CalendarCheck,
    event_reminder: CalendarCheck,
    request_update: MessageSquareReply,
    request_reply: MessageSquareReply,
    announcement: Megaphone,
    membership_status: ShieldCheck,
    system: Bell,
};

const ACCENT: Record<MemberNotificationType, string> = {
    event_registration: "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/30",
    event_reminder: "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/30",
    request_update: "text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30",
    request_reply: "text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/30",
    announcement: "text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/30",
    membership_status: "text-primary-600 bg-primary-50 dark:text-primary-300 dark:bg-primary-950/30",
    system: "text-secondary-600 bg-secondary-100 dark:text-secondary-300 dark:bg-secondary-800",
};

const formatRelative = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.round(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
};

export default function MemberNotificationsPage() {
    const { user, profile } = useMember();
    const [notifications, setNotifications] = useState<MemberNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);

    const load = useCallback(async () => {
        if (!user || !profile) return;
        setLoading(true);
        try {
            const data = await getMemberNotifications(user.uid);
            setNotifications(data);
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    const unreadCount = countUnreadNotifications(notifications);

    const handleMarkAll = async () => {
        if (!user || unreadCount === 0) return;
        setMarking(true);
        const previous = notifications;
        setNotifications((current) => current.map((n) => ({ ...n, read: true })));
        try {
            await markAllMemberNotificationsRead(user.uid, previous);
        } catch (error) {
            console.error("Failed to mark all read:", error);
            setNotifications(previous);
        } finally {
            setMarking(false);
        }
    };

    const handleMarkOne = async (notification: MemberNotification) => {
        if (notification.read) return;
        setNotifications((current) =>
            current.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        try {
            await markMemberNotificationRead(notification.id);
        } catch (error) {
            console.error("Failed to mark notification read:", error);
        }
    };

    return (
        <section className="space-y-5">
            <div className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                            Inbox
                        </p>
                        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black text-secondary-900 dark:text-white">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-black uppercase tracking-widest text-white">
                                    <BellRing className="h-3 w-3" /> {unreadCount} new
                                </span>
                            )}
                        </h1>
                        <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
                            System alerts for your registrations, requests, and membership.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleMarkAll}
                        disabled={unreadCount === 0 || marking}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-secondary-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-secondary-700 transition-colors hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-secondary-800"
                    >
                        <CheckCheck className="h-4 w-4" />
                        {marking ? "Marking..." : "Mark all read"}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center rounded-xl border border-secondary-200 bg-white p-10 text-secondary-500 dark:border-secondary-800 dark:bg-secondary-900">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-secondary-200 bg-white p-10 text-center dark:border-secondary-800 dark:bg-secondary-900">
                    <Bell className="mx-auto h-10 w-10 text-secondary-300 dark:text-secondary-600" />
                    <p className="mt-4 text-sm font-bold text-secondary-500 dark:text-secondary-400">
                        You&apos;re all caught up. New alerts will land here.
                    </p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {notifications.map((notification) => {
                        const Icon = ICONS[notification.type] || Bell;
                        const accent = ACCENT[notification.type] || ACCENT.system;
                        const content = (
                            <article
                                className={cn(
                                    "flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm transition-colors dark:bg-secondary-900",
                                    notification.read
                                        ? "border-secondary-200 dark:border-secondary-800"
                                        : "border-primary-200 ring-1 ring-primary-100 dark:border-primary-900/60 dark:ring-primary-900/40"
                                )}
                            >
                                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", accent)}>
                                    <Icon className="h-5 w-5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <p className="font-black text-secondary-900 dark:text-white">
                                            {notification.title}
                                        </p>
                                        <span className="text-xs font-bold text-secondary-400">
                                            {formatRelative(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">
                                        {notification.body}
                                    </p>
                                    {!notification.read && (
                                        <span className="mt-2 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-700 dark:bg-primary-950/30 dark:text-primary-300">
                                            New
                                        </span>
                                    )}
                                </div>
                            </article>
                        );

                        if (notification.link) {
                            return (
                                <li key={notification.id}>
                                    <Link
                                        href={notification.link}
                                        onClick={() => handleMarkOne(notification)}
                                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
                                    >
                                        {content}
                                    </Link>
                                </li>
                            );
                        }

                        return (
                            <li key={notification.id}>
                                <button
                                    type="button"
                                    onClick={() => handleMarkOne(notification)}
                                    className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
                                >
                                    {content}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

        </section>
    );
}

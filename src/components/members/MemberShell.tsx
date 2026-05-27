"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import {
    AlertTriangle,
    Bell,
    CalendarCheck,
    Clock,
    HandHeart,
    Home,
    LogOut,
    MessageSquareText,
    Newspaper,
    UserRound,
    Users,
    HeartHandshake,
} from "lucide-react";
import { MemberProfile } from "@/lib/types";
import { countUnreadNotifications, getMemberNotifications } from "@/lib/member-notifications";

const MEMBER_LINKS = [
    { label: "Overview", href: "/members", icon: Home },
    { label: "Updates", href: "/members/updates", icon: Newspaper },
    { label: "Notifications", href: "/members/notifications", icon: Bell },
    { label: "Profile", href: "/members/profile", icon: UserRound },
    { label: "Family", href: "/members/family", icon: Users },
    { label: "Volunteer", href: "/members/volunteer", icon: HeartHandshake },
    { label: "Events", href: "/members/events", icon: CalendarCheck },
    { label: "Donations", href: "/members/donations", icon: HandHeart },
    { label: "Requests", href: "/members/requests", icon: MessageSquareText },
];

export default function MemberShell({
    children,
    profile,
}: {
    children: React.ReactNode;
    profile: MemberProfile;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        let cancelled = false;
        if (!profile?.uid) return;
        const refresh = async () => {
            try {
                const data = await getMemberNotifications(profile.uid, 50);
                if (!cancelled) setUnreadNotifications(countUnreadNotifications(data));
            } catch (error) {
                console.error("Failed to refresh notification count:", error);
            }
        };
        refresh();
        const interval = window.setInterval(refresh, 60000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [profile?.uid, pathname]);

    const handleSignOut = async () => {
        await auth.signOut();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 pt-24">
            <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:px-8">
                <aside className="hidden w-64 shrink-0 lg:block">
                    <div className="sticky top-28 space-y-4">
                        <div className="rounded-xl border border-secondary-200 bg-white p-5 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                            <p className="text-xs font-bold uppercase tracking-widest text-secondary-400">Member Account</p>
                            <h2 className="mt-2 text-lg font-black text-secondary-900 dark:text-white">{profile.displayName}</h2>
                            <p className="mt-1 truncate text-sm text-secondary-500 dark:text-secondary-400">{profile.email}</p>
                        </div>

                        <nav className="rounded-xl border border-secondary-200 bg-white p-2 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                            {MEMBER_LINKS.map((link) => {
                                const isNotifications = link.href === "/members/notifications";
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors",
                                            pathname === link.href
                                                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                                                : "text-secondary-600 hover:bg-secondary-50 dark:text-secondary-300 dark:hover:bg-secondary-800"
                                        )}
                                    >
                                        <link.icon className="h-4 w-4" />
                                        <span className="flex-1">{link.label}</span>
                                        {isNotifications && unreadNotifications > 0 && (
                                            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-black text-white">
                                                {unreadNotifications > 99 ? "99+" : unreadNotifications}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </button>
                        </nav>
                    </div>
                </aside>

                <div className="min-w-0 flex-1">
                    <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-secondary-200 bg-white p-2 shadow-sm dark:border-secondary-800 dark:bg-secondary-900 sm:grid-cols-3 xl:grid-cols-7 lg:hidden">
                        {MEMBER_LINKS.map((link) => {
                            const isNotifications = link.href === "/members/notifications";
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "relative flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold",
                                        pathname === link.href
                                            ? "bg-primary-600 text-white"
                                            : "text-secondary-600 dark:text-secondary-300"
                                    )}
                                >
                                    <link.icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{link.label}</span>
                                    {isNotifications && unreadNotifications > 0 && (
                                        <span className="absolute -right-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                                            {unreadNotifications > 99 ? "99+" : unreadNotifications}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                    <MembershipStatusBanner profile={profile} />
                    {children}
                </div>
            </div>
        </div>
    );
}

function MembershipStatusBanner({ profile }: { profile: MemberProfile }) {
    if (profile.membershipStatus === "active") return null;

    const isPending = profile.membershipStatus === "pending";
    const Icon = isPending ? Clock : AlertTriangle;
    const tone = isPending
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
        : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200";
    const title = isPending ? "Awaiting admin approval" : "Your membership is suspended";
    const description = isPending
        ? "Some actions (event registrations, service requests) are unlocked once an admin approves your account."
        : "You can still view content, but submitting requests and registering for events is paused. Contact the masjid office for details.";

    return (
        <div className={cn("mb-5 flex items-start gap-3 rounded-xl border p-4", tone)}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
                <p className="font-black uppercase tracking-widest text-xs">{title}</p>
                <p className="mt-1 text-sm font-medium">{description}</p>
                {profile.statusReason && (
                    <p className="mt-2 rounded-lg bg-white/60 p-2 text-xs font-medium dark:bg-black/20">
                        <span className="font-black uppercase tracking-widest">Note from admin: </span>
                        {profile.statusReason}
                    </p>
                )}
            </div>
        </div>
    );
}

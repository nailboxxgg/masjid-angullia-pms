"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import {
    CalendarCheck,
    HandHeart,
    Home,
    LogOut,
    MessageSquareText,
    Newspaper,
    UserRound,
} from "lucide-react";
import { MemberProfile } from "@/lib/types";

const MEMBER_LINKS = [
    { label: "Overview", href: "/members", icon: Home },
    { label: "Updates", href: "/members/updates", icon: Newspaper },
    { label: "Profile", href: "/members/profile", icon: UserRound },
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
                            {MEMBER_LINKS.map((link) => (
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
                                    {link.label}
                                </Link>
                            ))}
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
                    <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-secondary-200 bg-white p-2 shadow-sm dark:border-secondary-800 dark:bg-secondary-900 sm:grid-cols-3 xl:grid-cols-6 lg:hidden">
                        {MEMBER_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold",
                                    pathname === link.href
                                        ? "bg-primary-600 text-white"
                                        : "text-secondary-600 dark:text-secondary-300"
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{link.label}</span>
                            </Link>
                        ))}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

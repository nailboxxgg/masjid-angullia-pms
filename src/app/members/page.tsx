"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    CalendarCheck,
    CheckCircle2,
    Clock,
    HandHeart,
    MessageSquareReply,
    MessageSquareText,
    Newspaper,
    Sparkles,
    UserRound,
    XCircle,
    Users,
    Bell,
    ChevronRight,
    Search,
    Home,
    User,
    Wifi,
    Battery,
    Compass
} from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { getEventById } from "@/lib/events";
import { getMemberDonations, getMemberEventRegistrations, getMemberServiceRequests } from "@/lib/members";
import { Donation, Event, MemberServiceRequest, Registrant } from "@/lib/types";

export default function MembersDashboardPage() {
    const { user, profile } = useMember();
    const router = useRouter();
    const [registrations, setRegistrations] = useState<Registrant[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [requests, setRequests] = useState<MemberServiceRequest[]>([]);
    const [eventsById, setEventsById] = useState<Record<string, Event | null>>({});
    const [time, setTime] = useState("");

    useEffect(() => {
        // Simple real-time clock for the PWA header
        const updateClock = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateClock();
        const interval = setInterval(updateClock, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user || !profile) return;

        Promise.all([
            getMemberEventRegistrations(user.uid),
            getMemberDonations(user.uid),
            getMemberServiceRequests(user.uid),
        ]).then(async ([eventData, donationData, requestData]) => {
            setRegistrations(eventData);
            setDonations(donationData);
            setRequests(requestData);

            const uniqueEventIds = Array.from(new Set(eventData.slice(0, 20).map((registration) => registration.eventId)));
            if (uniqueEventIds.length === 0) return;
            const pairs = await Promise.all(
                uniqueEventIds.map(async (eventId) => [eventId, await getEventById(eventId)] as const),
            );
            setEventsById(Object.fromEntries(pairs));
        }).catch((error) => {
            console.error("Failed to load member dashboard:", error);
        });
    }, [user]);

    const totalDonations = donations
        .filter((donation) => donation.status === "completed")
        .reduce((total, donation) => total + donation.amount, 0);

    const timelineItems = useMemo(
        () => buildTimeline(registrations, donations, requests, eventsById).slice(0, 12),
        [registrations, donations, requests, eventsById],
    );

    const pwaShortcuts = [
        { label: "Volunteer", href: "/members/volunteer", icon: HandHeart, bg: "bg-teal-500 text-white" },
        { label: "Donate", href: "/donations", icon: Sparkles, bg: "bg-amber-500 text-white" },
        { label: "My Events", href: "/members/events", icon: CalendarCheck, bg: "bg-purple-500 text-white" },
        { label: "Support", href: "/members/requests", icon: MessageSquareText, bg: "bg-blue-500 text-white" },
        { label: "Family Link", href: "/members/family", icon: Users, bg: "bg-emerald-500 text-white" },
        { label: "Profile", href: "/members/profile", icon: UserRound, bg: "bg-indigo-500 text-white" },
        { label: "Updates", href: "/members/updates", icon: Newspaper, bg: "bg-orange-500 text-white" },
        { label: "Alerts", href: "/members/notifications", icon: Bell, bg: "bg-pink-500 text-white" },
    ];

    return (
        <div>
            {/* MOBILE PROGRESSIVE WEB APP LAYOUT (Grab Style Reference) */}
            <div className="block md:hidden min-h-screen bg-secondary-50 dark:bg-secondary-950 pb-20">
                {/* 1. Header (Dynamic Clock + Battery/Status + User Profile) */}
                <header className="flex items-center justify-between px-5 py-4 bg-white dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800">
                    <div className="text-sm font-black text-secondary-900 dark:text-white">
                        {time || "8:16"}
                    </div>
                    <div className="flex items-center gap-4">
                        <Wifi className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
                        <Battery className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                        <Link href="/members/profile" className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-900 text-white hover:opacity-90">
                            <User className="w-4 h-4" />
                        </Link>
                    </div>
                </header>

                {/* 2. Brand Teal Promotional Banner Card */}
                <div className="p-4">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 p-5 text-white shadow-lg">
                        <div className="max-w-[65%] space-y-2">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/30 text-[10px] font-black uppercase tracking-wider">Community First</span>
                            <h2 className="text-lg font-black leading-tight">🕌 Masjid Angullia Community</h2>
                            <p className="text-xs text-teal-100 font-medium">Join us to volunteer for active opportunities and make a difference.</p>
                            <Link href="/members/volunteer" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-white hover:underline mt-2">
                                Register Now →
                            </Link>
                        </div>
                        {/* Vector Mosque silhouette replacement placement */}
                        <div className="absolute right-[-10px] bottom-[-15px] opacity-25 text-8xl pointer-events-none">
                            🕌
                        </div>
                    </div>
                </div>

                {/* 3. PWA Shortcuts Grid (2x4) */}
                <div className="px-4 py-2">
                    <div className="grid grid-cols-4 gap-y-5 gap-x-3 bg-white dark:bg-secondary-900 p-5 rounded-2xl border border-secondary-100 dark:border-secondary-800 shadow-sm">
                        {pwaShortcuts.map((item) => (
                            <Link key={item.label} href={item.href} className="flex flex-col items-center text-center space-y-2">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-md ${item.bg}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black text-secondary-800 dark:text-secondary-200 tracking-tight leading-none uppercase">
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 4. Quick Action / Zakat Bar ("Where to?" style) */}
                <div className="p-4">
                    <div className="flex items-center justify-between bg-white dark:bg-secondary-900 p-4 rounded-xl border border-secondary-100 dark:border-secondary-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Search className="w-5 h-5 text-teal-600" />
                            <div>
                                <p className="text-xs font-black text-secondary-800 dark:text-secondary-100 uppercase tracking-wider">Quick Action / Zakat</p>
                                <p className="text-[11px] text-secondary-400 font-medium">Make a fast payment to the masjid</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/30 rounded-full text-[10px] font-bold text-teal-700 dark:text-teal-300">
                            <Clock className="w-3 h-3" />
                            Asr Prayer
                        </div>
                    </div>
                </div>

                {/* 5. Timeline Feed (Grab Recent List Style) */}
                <div className="px-4 pb-6">
                    <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-secondary-400">Recent Activity Feed</h3>
                        {timelineItems.length === 0 ? (
                            <p className="text-xs text-secondary-400 text-center py-4">No recent activities logged.</p>
                        ) : (
                            <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
                                {timelineItems.slice(0, 5).map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link key={item.key} href={item.href} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 hover:bg-secondary-50/50">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400">
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-secondary-900 dark:text-white truncate">{item.title}</p>
                                                    <p className="text-[10px] text-secondary-400 truncate">{item.description}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-secondary-300 shrink-0" />
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 6. Sticky PWA Bottom Navigation Tab Bar */}
                <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800 px-6 py-2.5 flex items-center justify-between shadow-2xl z-50">
                    <Link href="/members" className="flex flex-col items-center text-teal-600 dark:text-teal-400">
                        <Home className="w-5 h-5" />
                        <span className="text-[9px] font-black uppercase tracking-widest mt-1">Home</span>
                    </Link>
                    <Link href="/members/updates" className="flex flex-col items-center text-secondary-400 hover:text-secondary-600 dark:hover:text-white">
                        <Compass className="w-5 h-5" />
                        <span className="text-[9px] font-black uppercase tracking-widest mt-1">Updates</span>
                    </Link>
                    <Link href="/members/profile" className="flex flex-col items-center text-secondary-400 hover:text-secondary-600 dark:hover:text-white">
                        <User className="w-5 h-5" />
                        <span className="text-[9px] font-black uppercase tracking-widest mt-1">Account</span>
                    </Link>
                </nav>
            </div>

            {/* STANDARD DESKTOP VIEWPORT LAYOUT */}
            <div className="hidden md:block space-y-6">
                <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">Assalamu alaikum</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary-900 dark:text-white">
                        Welcome, {profile?.displayName}
                    </h1>
                    <p className="mt-3 max-w-2xl text-secondary-600 dark:text-secondary-400">
                        Your member account gives you a private place to manage your profile, track registrations, keep donation records, and submit requests to the masjid team.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-secondary-200 bg-white p-5 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                        <p className="text-sm font-bold text-secondary-500">Event Registrations</p>
                        <p className="mt-3 text-3xl font-black text-secondary-900 dark:text-white">{registrations.length}</p>
                    </div>
                    <div className="rounded-xl border border-secondary-200 bg-white p-5 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                        <p className="text-sm font-bold text-secondary-500">Total Donations</p>
                        <p className="mt-3 text-3xl font-black text-secondary-900 dark:text-white">₱{totalDonations.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-secondary-200 bg-white p-5 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                        <p className="text-sm font-bold text-secondary-500">Open Requests</p>
                        <p className="mt-3 text-3xl font-black text-secondary-900 dark:text-white">
                            {requests.filter((request) => request.status !== "resolved" && request.status !== "cancelled").length}
                        </p>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {pwaShortcuts.map((shortcut) => (
                        <Link
                            key={shortcut.href}
                            href={shortcut.href}
                            className="rounded-xl border border-secondary-200 bg-white p-5 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50/50 dark:border-secondary-800 dark:bg-secondary-900 dark:hover:bg-primary-950/20"
                        >
                            <shortcut.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                            <p className="mt-4 font-black text-secondary-900 dark:text-white">{shortcut.label}</p>
                        </Link>
                    ))}
                </section>

                <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">Activity</p>
                            <h2 className="mt-1 text-xl font-black text-secondary-900 dark:text-white">Your recent timeline</h2>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-widest">
                            <Link href="/members/events" className="rounded-full bg-secondary-100 px-3 py-1.5 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200">Events</Link>
                            <Link href="/members/donations" className="rounded-full bg-secondary-100 px-3 py-1.5 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200">Donations</Link>
                            <Link href="/members/requests" className="rounded-full bg-secondary-100 px-3 py-1.5 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200">Requests</Link>
                        </div>
                    </div>

                    {timelineItems.length === 0 ? (
                        <div className="mt-6 rounded-xl border border-dashed border-secondary-200 p-8 text-center dark:border-secondary-800">
                            <Sparkles className="mx-auto h-8 w-8 text-secondary-300" />
                            <p className="mt-3 text-sm font-bold text-secondary-500 dark:text-secondary-400">
                                No activity yet. Register for an event or make a donation to see it here.
                            </p>
                        </div>
                    ) : (
                        <ol className="mt-6 space-y-3">
                            {timelineItems.map((item) => (
                                <li key={item.key}>
                                    <TimelineRow item={item} />
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </div>
        </div>
    );
}

type TimelineKind = "event" | "donation" | "request";

interface TimelineItem {
    key: string;
    kind: TimelineKind;
    timestamp: number;
    title: string;
    description: string;
    statusLabel?: string;
    statusTone?: "emerald" | "amber" | "blue" | "red" | "secondary";
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const TONE_CLASS: Record<NonNullable<TimelineItem["statusTone"]>, string> = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    red: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    secondary: "bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200",
};

const KIND_ACCENT: Record<TimelineKind, string> = {
    event: "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/30",
    donation: "text-primary-600 bg-primary-50 dark:text-primary-300 dark:bg-primary-950/30",
    request: "text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/30",
};

const REGISTRATION_TONE: Record<Registrant["status"], TimelineItem["statusTone"]> = {
    accepted: "emerald",
    attended: "emerald",
    pending: "amber",
    rejected: "red",
};

const DONATION_TONE: Record<Donation["status"], TimelineItem["statusTone"]> = {
    completed: "emerald",
    pending: "amber",
    failed: "red",
};

const REQUEST_TONE: Record<MemberServiceRequest["status"], TimelineItem["statusTone"]> = {
    pending: "amber",
    in_review: "blue",
    resolved: "emerald",
    cancelled: "red",
};

function buildTimeline(
    registrations: Registrant[],
    donations: Donation[],
    requests: MemberServiceRequest[],
    eventsById: Record<string, Event | null>,
): TimelineItem[] {
    const items: TimelineItem[] = [];

    for (const registration of registrations) {
        const eventTitle = eventsById[registration.eventId]?.title;
        items.push({
            key: `reg-${registration.id}`,
            kind: "event",
            timestamp: registration.createdAt,
            title: eventTitle ? `Registered: ${eventTitle}` : "Registered for an event",
            description: eventsById[registration.eventId]?.date || `Registrant: ${registration.name || "you"}`,
            statusLabel: registration.status,
            statusTone: REGISTRATION_TONE[registration.status] || "secondary",
            href: "/members/events",
            icon: CalendarCheck,
        });
    }

    for (const donation of donations) {
        items.push({
            key: `don-${donation.id}`,
            kind: "donation",
            timestamp: donation.date,
            title: `Donated ₱${donation.amount.toLocaleString()}`,
            description: donation.type || "Donation",
            statusLabel: donation.status,
            statusTone: DONATION_TONE[donation.status] || "secondary",
            href: "/members/donations",
            icon: HandHeart,
        });
    }

    for (const request of requests) {
        const hasReply = Boolean(request.adminReply);
        items.push({
            key: `req-${request.id}`,
            kind: "request",
            timestamp: hasReply && request.repliedAt ? request.repliedAt : request.createdAt,
            title: hasReply ? `Admin replied: ${request.subject}` : `Submitted: ${request.subject}`,
            description: request.type,
            statusLabel: request.status.replace("_", " "),
            statusTone: REQUEST_TONE[request.status] || "secondary",
            href: "/members/requests",
            icon: hasReply ? MessageSquareReply : MessageSquareText,
        });
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
}

function formatRelative(timestamp: number): string {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "just now";
    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

function StatusBadge({ tone, label }: { tone: TimelineItem["statusTone"]; label: string }) {
    const cls = TONE_CLASS[tone || "secondary"];
    const Icon = tone === "emerald" ? CheckCircle2 : tone === "red" ? XCircle : Clock;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${cls}`}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}

function TimelineRow({ item }: { item: TimelineItem }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            className="flex items-start gap-4 rounded-xl border border-secondary-200 bg-white p-4 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50/40 dark:border-secondary-800 dark:bg-secondary-900 dark:hover:bg-primary-950/20"
        >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${KIND_ACCENT[item.kind]}`}>
                <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-black text-secondary-900 dark:text-white">{item.title}</p>
                    <span className="text-xs font-bold text-secondary-400">{formatRelative(item.timestamp)}</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-secondary-500 dark:text-secondary-400">{item.description}</p>
                {item.statusLabel && (
                    <div className="mt-2">
                        <StatusBadge tone={item.statusTone} label={item.statusLabel} />
                    </div>
                )}
            </div>
        </Link>
    );
}

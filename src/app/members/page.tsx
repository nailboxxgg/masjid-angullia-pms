"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { getEventById } from "@/lib/events";
import { getMemberDonations, getMemberEventRegistrations, getMemberServiceRequests } from "@/lib/members";
import { Donation, Event, MemberServiceRequest, Registrant } from "@/lib/types";

const shortcuts = [
    { label: "Update Profile", href: "/members/profile", icon: UserRound },
    { label: "Member Updates", href: "/members/updates", icon: Newspaper },
    { label: "My Events", href: "/members/events", icon: CalendarCheck },
    { label: "Donation Receipts", href: "/members/donations", icon: HandHeart },
    { label: "Service Requests", href: "/members/requests", icon: MessageSquareText },
];

export default function MembersDashboardPage() {
    const { user, profile } = useMember();
    const [registrations, setRegistrations] = useState<Registrant[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [requests, setRequests] = useState<MemberServiceRequest[]>([]);
    const [eventsById, setEventsById] = useState<Record<string, Event | null>>({});

    useEffect(() => {
        if (!user) return;

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

    return (
        <div className="space-y-6">
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
                {shortcuts.map((shortcut) => (
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

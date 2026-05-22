"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, HandHeart, MessageSquareText, Newspaper, UserRound } from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { getMemberDonations, getMemberEventRegistrations, getMemberServiceRequests } from "@/lib/members";
import { Donation, MemberServiceRequest, Registrant } from "@/lib/types";

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

    useEffect(() => {
        if (!user) return;

        Promise.all([
            getMemberEventRegistrations(user.uid),
            getMemberDonations(user.uid),
            getMemberServiceRequests(user.uid),
        ]).then(([eventData, donationData, requestData]) => {
            setRegistrations(eventData);
            setDonations(donationData);
            setRequests(requestData);
        }).catch((error) => {
            console.error("Failed to load member dashboard:", error);
        });
    }, [user]);

    const totalDonations = donations
        .filter((donation) => donation.status === "completed")
        .reduce((total, donation) => total + donation.amount, 0);

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
        </div>
    );
}

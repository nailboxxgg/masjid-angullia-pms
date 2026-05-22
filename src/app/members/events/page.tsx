"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ExternalLink } from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { getMemberEventRegistrations } from "@/lib/members";
import { Registrant } from "@/lib/types";

export default function MemberEventsPage() {
    const { user } = useMember();
    const [registrations, setRegistrations] = useState<Registrant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        getMemberEventRegistrations(user.uid)
            .then(setRegistrations)
            .catch((error) => console.error("Failed to load registrations:", error))
            .finally(() => setLoading(false));
    }, [user]);

    return (
        <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black text-secondary-900 dark:text-white">My Events</h1>
                    <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">Track event registrations made while signed in.</p>
                </div>
                <Link href="/events" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-black text-white hover:bg-primary-700">
                    Browse Events <ExternalLink className="h-4 w-4" />
                </Link>
            </div>

            <div className="mt-6 space-y-3">
                {loading ? (
                    <p className="text-sm text-secondary-500">Loading registrations...</p>
                ) : registrations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-secondary-200 p-8 text-center dark:border-secondary-800">
                        <Calendar className="mx-auto h-10 w-10 text-secondary-300" />
                        <p className="mt-3 font-bold text-secondary-700 dark:text-secondary-200">No member event registrations yet.</p>
                    </div>
                ) : registrations.map((registration) => (
                    <div key={registration.id} className="flex flex-col gap-2 rounded-lg border border-secondary-200 p-4 dark:border-secondary-800 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-black text-secondary-900 dark:text-white">{registration.name}</p>
                            <p className="text-sm text-secondary-500">{registration.email || registration.contactNumber}</p>
                        </div>
                        <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300">
                            {registration.status}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

"use client";

import { useEffect, useState } from "react";
import { Calendar, ExternalLink, HandHeart, Loader2, MapPin, Trash2 } from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { getEvents } from "@/lib/events";
import {
    registerAsVolunteer,
    cancelVolunteerRegistration,
    getMemberVolunteerRegistrations,
} from "@/lib/volunteer";
import { Event, VolunteerRegistration } from "@/lib/types";
import Link from "next/link";

const volStatusStyles: Record<VolunteerRegistration["status"], string> = {
    registered: "bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300",
    checked_in: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    completed: "bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300",
    cancelled: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
};

export default function MemberVolunteerPage() {
    const { user, profile } = useMember();
    const [events, setEvents] = useState<Event[]>([]);
    const [registrations, setRegistrations] = useState<VolunteerRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [signingUpId, setSigningUpId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        setError("");
        try {
            const [allEvents, myRegs] = await Promise.all([
                getEvents(50),
                getMemberVolunteerRegistrations(user.uid),
            ]);
            // Only show events that accept volunteers
            setEvents(allEvents.filter((e) => e.volunteerPositionsAvailable));
            setRegistrations(myRegs);
        } catch (err) {
            console.error("Failed to load volunteer data:", err);
            setError("Unable to load volunteer opportunities. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const registeredEventIds = new Set(registrations.filter((r) => r.status !== "cancelled").map((r) => r.eventId));

    const handleSignUp = async (event: Event) => {
        if (!user || !profile) return;
        setSigningUpId(event.id);
        setError("");
        setSuccess("");

        const result = await registerAsVolunteer(
            event.id,
            {
                memberId: user.uid,
                memberName: profile.displayName,
                memberEmail: profile.email,
                notes: notes[event.id] || undefined,
            },
            event.title,
        );

        if (result.success) {
            setSuccess(`You've signed up to volunteer for "${event.title}"!`);
            setTimeout(() => setSuccess(""), 4000);
            await loadData();
        } else {
            setError(result.error || "Failed to sign up.");
        }
        setSigningUpId(null);
    };

    const handleCancel = async (reg: VolunteerRegistration) => {
        if (!user) return;
        const confirmed = window.confirm("Cancel this volunteer registration?");
        if (!confirmed) return;

        setCancellingId(reg.id);
        setError("");
        try {
            await cancelVolunteerRegistration(user.uid, reg.id);
            await loadData();
        } catch (err) {
            console.error("Failed to cancel:", err);
            setError(err instanceof Error ? err.message : "Failed to cancel.");
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* My Volunteer Registrations */}
            <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-secondary-900 dark:text-white">Volunteer</h1>
                        <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">Sign up for volunteer opportunities and track your hours.</p>
                    </div>
                    <Link href="/events" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-black text-white hover:bg-primary-700">
                        Browse Events <ExternalLink className="h-4 w-4" />
                    </Link>
                </div>

                {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
                {success && <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{success}</p>}

                <div className="mt-6 space-y-3">
                    <h2 className="text-sm font-black uppercase tracking-widest text-secondary-500">My Registrations</h2>
                    {loading ? (
                        <p className="text-sm text-secondary-500">Loading…</p>
                    ) : registrations.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-secondary-200 p-8 text-center dark:border-secondary-800">
                            <HandHeart className="mx-auto h-10 w-10 text-secondary-300" />
                            <p className="mt-3 font-bold text-secondary-700 dark:text-secondary-200">You haven&apos;t signed up for any volunteer activities yet.</p>
                        </div>
                    ) : (
                        registrations.map((reg) => {
                            const event = events.find((e) => e.id === reg.eventId);
                            return (
                                <div key={reg.id} className="rounded-lg border border-secondary-200 p-4 dark:border-secondary-800">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="font-black text-secondary-900 dark:text-white">{event?.title || "Volunteer activity"}</p>
                                            {event && (
                                                <div className="mt-2 flex flex-col gap-1 text-sm text-secondary-500 dark:text-secondary-400">
                                                    <span className="inline-flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        {event.date} {event.time && `· ${event.time}`}
                                                    </span>
                                                    <span className="inline-flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        {event.location}
                                                    </span>
                                                </div>
                                            )}
                                            {reg.notes && <p className="mt-2 text-xs italic text-secondary-400">&ldquo;{reg.notes}&rdquo;</p>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${volStatusStyles[reg.status]}`}>
                                                {reg.status.replace("_", " ")}
                                            </span>
                                            {reg.status === "registered" && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCancel(reg)}
                                                    disabled={cancellingId === reg.id}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-black uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                                                >
                                                    {cancellingId === reg.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Available Opportunities */}
            <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                <h2 className="text-lg font-black text-secondary-900 dark:text-white">Available Opportunities</h2>
                <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">Events currently accepting volunteer sign‑ups.</p>

                <div className="mt-5 space-y-3">
                    {loading ? (
                        <p className="text-sm text-secondary-500">Loading…</p>
                    ) : events.filter((e) => !registeredEventIds.has(e.id)).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-secondary-200 p-8 text-center dark:border-secondary-800">
                            <HandHeart className="mx-auto h-10 w-10 text-secondary-300" />
                            <p className="mt-3 font-bold text-secondary-700 dark:text-secondary-200">No new volunteer opportunities right now.</p>
                        </div>
                    ) : (
                        events
                            .filter((e) => !registeredEventIds.has(e.id))
                            .map((event) => (
                                <div key={event.id} className="rounded-lg border border-secondary-200 p-4 dark:border-secondary-800">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="font-black text-secondary-900 dark:text-white">{event.title}</p>
                                            <div className="mt-2 flex flex-col gap-1 text-sm text-secondary-500 dark:text-secondary-400">
                                                <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> {event.date} {event.time && `· ${event.time}`}</span>
                                                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.location}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="text"
                                                placeholder="Notes (optional)"
                                                value={notes[event.id] || ""}
                                                onChange={(e) => setNotes({ ...notes, [event.id]: e.target.value })}
                                                className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2 text-xs outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950 sm:w-48"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSignUp(event)}
                                                disabled={signingUpId === event.id}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-primary-700 disabled:opacity-60"
                                            >
                                                {signingUpId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HandHeart className="h-3.5 w-3.5" />}
                                                Sign Up
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </section>
        </div>
    );
}

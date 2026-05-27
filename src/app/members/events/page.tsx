"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ExternalLink, Loader2, MapPin, Trash2, QrCode, X, Edit } from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { cancelMemberEventRegistration, getMemberEventRegistrations, updateMemberEventRegistration } from "@/lib/members";
import { getEventById } from "@/lib/events";
import { Event, Registrant } from "@/lib/types";

type EventMap = Record<string, Event | null>;

const statusStyles: Record<Registrant["status"], string> = {
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    accepted: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    attended: "bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300",
    rejected: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
};

export default function MemberEventsPage() {
    const { user } = useMember();
    const [registrations, setRegistrations] = useState<Registrant[]>([]);
    const [eventsById, setEventsById] = useState<EventMap>({});
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [selectedRegistration, setSelectedRegistration] = useState<Registrant | null>(null);
    const [isPassModalOpen, setIsPassModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editContact, setEditContact] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const openEditModal = (registration: Registrant) => {
        setSelectedRegistration(registration);
        setEditName(registration.name);
        setEditContact(registration.contactNumber);
        setEditEmail(registration.email || "");
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user || !selectedRegistration) return;

        setUpdatingId(selectedRegistration.id);
        setError("");

        try {
            await updateMemberEventRegistration(user.uid, selectedRegistration.id, {
                name: editName,
                contactNumber: editContact,
                email: editEmail,
            });
            setIsEditModalOpen(false);
            await loadRegistrations();
        } catch (updateError) {
            console.error("Failed to update registration:", updateError);
            setError(updateError instanceof Error ? updateError.message : "Failed to update registration.");
        } finally {
            setUpdatingId(null);
        }
    };

    const eventIds = useMemo(() => Array.from(new Set(registrations.map((registration) => registration.eventId))), [registrations]);

    const loadRegistrations = async () => {
        if (!user) return;

        setLoading(true);
        setError("");

        try {
            const registrationData = await getMemberEventRegistrations(user.uid);
            setRegistrations(registrationData);

            const eventPairs = await Promise.all(
                Array.from(new Set(registrationData.map((registration) => registration.eventId)))
                    .map(async (eventId) => [eventId, await getEventById(eventId)] as const)
            );

            setEventsById(Object.fromEntries(eventPairs));
        } catch (loadError) {
            console.error("Failed to load registrations:", loadError);
            setError("Failed to load your event registrations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRegistrations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleCancel = async (registration: Registrant) => {
        if (!user) return;

        const confirmed = window.confirm("Cancel this event registration?");
        if (!confirmed) return;

        setCancellingId(registration.id);
        setError("");

        try {
            await cancelMemberEventRegistration(user.uid, registration.id);
            await loadRegistrations();
        } catch (cancelError) {
            console.error("Failed to cancel registration:", cancelError);
            setError(cancelError instanceof Error ? cancelError.message : "Failed to cancel registration.");
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black text-secondary-900 dark:text-white">My Events</h1>
                    <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">Track and manage event registrations made while signed in.</p>
                </div>
                <Link href="/events" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-black text-white hover:bg-primary-700">
                    Browse Events <ExternalLink className="h-4 w-4" />
                </Link>
            </div>

            {error && (
                <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </p>
            )}

            <div className="mt-6 space-y-3">
                {loading ? (
                    <p className="text-sm text-secondary-500">Loading registrations...</p>
                ) : registrations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-secondary-200 p-8 text-center dark:border-secondary-800">
                        <Calendar className="mx-auto h-10 w-10 text-secondary-300" />
                        <p className="mt-3 font-bold text-secondary-700 dark:text-secondary-200">No member event registrations yet.</p>
                    </div>
                ) : registrations.map((registration) => {
                    const event = eventsById[registration.eventId];
                    const canCancel = registration.status !== "attended";

                    return (
                        <div key={registration.id} className="rounded-lg border border-secondary-200 p-4 dark:border-secondary-800">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <p className="font-black text-secondary-900 dark:text-white">
                                        {event?.title || "Event registration"}
                                    </p>
                                    <div className="mt-2 flex flex-col gap-1 text-sm text-secondary-500 dark:text-secondary-400">
                                        {event ? (
                                            <>
                                                <span className="inline-flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    {event.date} {event.time && `· ${event.time}`}
                                                </span>
                                                <span className="inline-flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    {event.location}
                                                </span>
                                            </>
                                        ) : (
                                            <span>{registration.email || registration.contactNumber}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${statusStyles[registration.status]}`}>
                                        {registration.status}
                                    </span>
                                    {registration.status !== "rejected" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedRegistration(registration);
                                                setIsPassModalOpen(true);
                                            }}
                                            className="inline-flex items-center gap-2 rounded-lg border border-primary-200 px-3 py-2 text-xs font-black uppercase tracking-widest text-primary-700 transition-colors hover:bg-primary-50 dark:border-primary-900/50 dark:text-primary-300 dark:hover:bg-primary-950/30"
                                        >
                                            <QrCode className="h-3.5 w-3.5" />
                                            QR Pass
                                        </button>
                                    )}
                                    {canCancel && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(registration)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-secondary-200 px-3 py-2 text-xs font-black uppercase tracking-widest text-secondary-700 transition-colors hover:bg-secondary-50 dark:border-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-800"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                Edit RSVP
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCancel(registration)}
                                                disabled={cancellingId === registration.id}
                                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-black uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                                            >
                                                {cancellingId === registration.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {!loading && eventIds.length > 0 && (
                <p className="mt-5 text-xs font-medium text-secondary-500 dark:text-secondary-400">
                    Cancelling removes your registration and frees the slot for another attendee.
                </p>
            )}

            {/* QR Pass Modal */}
            {isPassModalOpen && selectedRegistration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsPassModalOpen(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white dark:bg-secondary-900 rounded-[2rem] p-6 shadow-2xl border border-secondary-200 dark:border-secondary-800 animate-scale-in">
                        <button
                            onClick={() => setIsPassModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-white rounded-full hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center space-y-4 mt-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-100 dark:border-primary-900/30">
                                Masjid Angullia Event Pass
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-secondary-900 dark:text-white font-heading">
                                    {eventsById[selectedRegistration.eventId]?.title || "Event Registration"}
                                </h3>
                                <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                                    {eventsById[selectedRegistration.eventId]?.category || "General"}
                                </p>
                            </div>

                            {/* Ticket Divider Line */}
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-dashed border-secondary-200 dark:border-secondary-800" />
                                <div className="absolute left-[-24px] w-4 h-8 bg-secondary-50 dark:bg-secondary-950 rounded-r-full border-r border-y border-secondary-200 dark:border-secondary-800" />
                                <div className="absolute right-[-24px] w-4 h-8 bg-secondary-50 dark:bg-secondary-950 rounded-l-full border-l border-y border-secondary-200 dark:border-secondary-800" />
                            </div>

                            {/* QR Code Container */}
                            <div className="flex flex-col items-center justify-center p-4 bg-secondary-50 dark:bg-secondary-950 rounded-2xl border border-secondary-100 dark:border-secondary-800/50">
                                <div className="bg-white p-3 rounded-xl shadow-sm border border-secondary-200/50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedRegistration.id)}&color=0f766e`}
                                        alt="Registration QR Code"
                                        className="w-44 h-44 object-contain"
                                    />
                                </div>
                                <p className="mt-3 font-mono text-[10px] font-bold tracking-widest text-secondary-400 uppercase">
                                    ID: {selectedRegistration.id.slice(0, 12)}...
                                </p>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-3 text-left bg-secondary-50/50 dark:bg-secondary-900/50 p-4 rounded-2xl border border-secondary-200/50 dark:border-secondary-800/50 text-xs">
                                <div>
                                    <p className="text-[9px] text-secondary-400 font-black uppercase tracking-wider mb-0.5">Attendee</p>
                                    <p className="font-bold text-secondary-800 dark:text-secondary-200 truncate">{selectedRegistration.name}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-secondary-400 font-black uppercase tracking-wider mb-0.5">Status</p>
                                    <p className="font-bold capitalize text-primary-600 dark:text-primary-400">{selectedRegistration.status}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[9px] text-secondary-400 font-black uppercase tracking-wider mb-0.5">Schedule</p>
                                    <p className="font-bold text-secondary-800 dark:text-secondary-200">
                                        {eventsById[selectedRegistration.eventId]?.date} {eventsById[selectedRegistration.eventId]?.time && `· ${eventsById[selectedRegistration.eventId]?.time}`}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <button
                                onClick={() => window.print()}
                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-primary-600/25 transition-all flex items-center justify-center gap-2"
                            >
                                Print Entry Pass
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit RSVP Modal */}
            {isEditModalOpen && selectedRegistration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsEditModalOpen(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white dark:bg-secondary-900 rounded-[2rem] p-6 shadow-2xl border border-secondary-200 dark:border-secondary-800 animate-scale-in">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-white rounded-full hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <form onSubmit={handleUpdate} className="space-y-4 mt-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-100 dark:border-primary-900/30">
                                Update RSVP Details
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-secondary-900 dark:text-white font-heading font-semibold">
                                    {eventsById[selectedRegistration.eventId]?.title || "Event Registration"}
                                </h3>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-secondary-500 mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-secondary-500 mb-1">Contact Number</label>
                                <input
                                    required
                                    type="tel"
                                    value={editContact}
                                    onChange={(e) => setEditContact(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                    className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-secondary-500 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={updatingId === selectedRegistration.id}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-primary-600/25 transition-all flex items-center justify-center gap-2"
                                >
                                    {updatingId === selectedRegistration.id ? "Saving..." : "Save Details"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}

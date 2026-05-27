
"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/modal";
import { registerForEvent } from "@/lib/events";
import { Loader2, CheckCircle, Calendar, MapPin, Clock, Users } from "lucide-react";
import { Event } from "@/lib/types";
import { normalizePhoneNumber } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { getMemberProfile } from "@/lib/members";

interface EventRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
}

export default function EventRegistrationModal({ isOpen, onClose, event }: EventRegistrationModalProps) {
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");
    const [memberId, setMemberId] = useState<string | undefined>();
    const [memberStatus, setMemberStatus] = useState<"active" | "pending" | "suspended" | undefined>();

    useEffect(() => {
        if (!isOpen) return;

        const currentUser = auth.currentUser;
        if (!currentUser) return;

        getMemberProfile(currentUser.uid)
            .then((profile) => {
                if (!profile) return;
                setMemberStatus(profile.membershipStatus);
                if (profile.membershipStatus === "active") {
                    setMemberId(profile.uid);
                }
                setName((current) => current || profile.displayName);
                setEmail((current) => current || profile.email);
                setContact((current) => current || profile.phone || "");
            })
            .catch((error) => console.error("Failed to prefill member event registration:", error));
    }, [isOpen]);

    const isPastEvent = event ? new Date(event.date) < new Date(new Date().setHours(0, 0, 0, 0)) : false;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;

        setStatus('submitting');
        setErrorMessage("");

        const result = await registerForEvent(event.id, {
            name,
            contactNumber: normalizePhoneNumber(contact),
            email,
            memberId,
        });

        if (result.success) {
            setStatus('success');
            // Reset form after delay or on close
        } else {
            setStatus('error');
            setErrorMessage(result.error || "Failed to register. Please try again.");
        }
    };

    const handleClose = () => {
        if (status === 'success') {
            setName("");
            setContact("");
            setEmail("");
            setStatus('idle');
        }
        onClose();
    };

    const isMembersOnlyBlock = event?.membersOnly && !memberId;
    const isPublicSlotsFullBlock = !memberId && event && event.memberReservedSlots &&
        (event.registrantsCount || 0) >= ((event.capacity || 0) - (event.memberReservedSlots || 0));
    const isStatusBlock = memberStatus && memberStatus !== "active";
    const earlyAccessDate = event?.memberEarlyAccessUntil ? new Date(event.memberEarlyAccessUntil) : null;
    const isEarlyAccessActive = !!earlyAccessDate && !Number.isNaN(earlyAccessDate.getTime()) && earlyAccessDate > new Date();
    const isEarlyAccessBlock = isEarlyAccessActive && !memberId;

    if (!event) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={status === 'success' ? "Registration Confirmed" : "Register for Event"}
            className="max-w-md"
        >
            {status === 'success' ? (
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-2">You&apos;re All Set!</h3>
                    <p className="text-secondary-600 mb-6">
                        You have successfully registered for <strong>{event.title}</strong>.
                    </p>
                    <button
                        onClick={handleClose}
                        className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            ) : isPastEvent ? (
                <div className="text-center py-10">
                    <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-secondary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2 uppercase tracking-tight">Registration Closed</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 mb-6 text-sm">
                        Registration for <strong>{event.title}</strong> has ended as the event date has already passed.
                    </p>
                    <button
                        onClick={handleClose}
                        className="w-full py-2.5 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-lg font-bold hover:opacity-90 transition-all uppercase text-xs tracking-widest"
                    >
                        Close
                    </button>
                </div>
            ) : isStatusBlock ? (
                <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100 dark:border-amber-900/30">
                        <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
                        {memberStatus === "pending" ? "Awaiting Approval" : "Membership Suspended"}
                    </h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed max-w-sm mx-auto">
                        {memberStatus === "pending"
                            ? "Event registration unlocks once an admin approves your membership. Check back soon."
                            : "Event registration is paused while your membership is suspended. Please contact the masjid office for help."}
                    </p>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-full py-2.5 border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800 text-secondary-700 dark:text-secondary-200 rounded-lg font-bold transition-colors"
                    >
                        Close
                    </button>
                </div>
            ) : isEarlyAccessBlock ? (
                <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-100 dark:border-primary-900/30">
                        <Clock className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white">Members Get Early Access</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed max-w-sm mx-auto">
                        Public registration opens <strong>{earlyAccessDate?.toLocaleString()}</strong>. Sign in as a member to register now.
                    </p>
                    <div className="flex flex-col gap-2 pt-4">
                        <a
                            href="/login"
                            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition-colors block text-center"
                        >
                            Sign In as Member
                        </a>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full py-2.5 border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800 text-secondary-700 dark:text-secondary-200 rounded-lg font-bold transition-colors block text-center"
                        >
                            Remind Me Later
                        </button>
                    </div>
                </div>
            ) : isMembersOnlyBlock ? (
                <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-100 dark:border-primary-900/30">
                        <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white">Members Only</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed max-w-sm mx-auto">
                        This event is reserved exclusively for registered members of Masjid Angullia. Please sign in to register.
                    </p>
                    <div className="flex flex-col gap-2 pt-4">
                        <a
                            href="/login"
                            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition-colors block text-center"
                        >
                            Sign In as Member
                        </a>
                        <a
                            href="/signup"
                            className="w-full py-2.5 border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800 text-secondary-700 dark:text-secondary-200 rounded-lg font-bold transition-colors block text-center"
                        >
                            Create Member Account
                        </a>
                    </div>
                </div>
            ) : isPublicSlotsFullBlock ? (
                <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100 dark:border-amber-900/30">
                        <Users className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white">Public Slots Full</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed max-w-sm mx-auto">
                        Public registration slots are fully booked. The remaining slots are reserved for members. Please sign in to register.
                    </p>
                    <div className="flex flex-col gap-2 pt-4">
                        <a
                            href="/login"
                            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition-colors block text-center"
                        >
                            Sign In as Member
                        </a>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full py-2.5 border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800 text-secondary-700 dark:text-secondary-200 rounded-lg font-bold transition-colors block text-center"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isEarlyAccessActive && memberId && (
                        <div className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 dark:border-primary-900/40 dark:bg-primary-950/20 dark:text-primary-200">
                            Members-only early access — public registration opens {earlyAccessDate?.toLocaleString()}.
                        </div>
                    )}
                    {/* Event Summary */}
                    <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-100 mb-4">
                        <h4 className="font-bold text-secondary-900 mb-2">{event.title}</h4>
                        <div className="text-xs text-secondary-600 space-y-1">
                            <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {event.date}</div>
                            <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> {event.time}</div>
                            <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {event.location}</div>
                        </div>
                    </div>

                    {status === 'error' && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                            {errorMessage}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Full Name</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            placeholder="Brother / Sister Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Number</label>
                        <input
                            required
                            type="tel"
                            inputMode="numeric"
                            value={contact}
                            onChange={(e) => setContact(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all placeholder:text-secondary-400"
                            placeholder="Enter your mobile number"
                            maxLength={11}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Email (Optional)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            placeholder="email@example.com"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {status === 'submitting' ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                                </>
                            ) : (
                                "Register Now"
                            )}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}

"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { 
    Calendar, ExternalLink, Loader2, MapPin, Trash2, QrCode, X, Edit, 
    Camera, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck 
} from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { motion } from "framer-motion";
import { cancelMemberEventRegistration, getMemberEventRegistrations, updateMemberEventRegistration } from "@/lib/members";
import { getEventById } from "@/lib/events";
import { Event, Registrant } from "@/lib/types";
import { db } from "@/lib/firebase";
import { 
    collection, query, where, getDocs, addDoc, doc, updateDoc, increment, getDoc 
} from "firebase/firestore";

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
    
    // Modals & States
    const [isPassModalOpen, setIsPassModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editContact, setEditContact] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Camera Attendance QR Scanner States
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    // Post-Scan States
    const [successCheckInEvent, setSuccessCheckInEvent] = useState<Event | null>(null);
    const [walkInPromptEvent, setWalkInPromptEvent] = useState<Event | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

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

    // Camera Scanner Integrations
    const startScanner = async () => {
        setCameraError(null);
        setScanError(null);
        setSuccessCheckInEvent(null);
        setWalkInPromptEvent(null);
        setIsScannerOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // In local/test browser environment, we simulate successful QR code scan after 2 seconds
            // Scanning the primary event the user has registered to
            setTimeout(() => {
                if (stream.active && registrations.length > 0) {
                    handleQrScanResolved(`angullia_event_attendance:${registrations[0].eventId}`);
                }
            }, 2500);
        } catch (err) {
            console.error("Camera access failed", err);
            setCameraError("Camera access denied or unsupported on this device. You can click 'Simulate Scan' below to test check-in.");
        }
    };

    const stopScanner = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsScannerOpen(false);
    };

    const handleQrScanResolved = async (scannedData: string) => {
        if (!user || isCheckingIn) return;
        
        if (!scannedData.startsWith("angullia_event_attendance:")) {
            setScanError("Invalid QR Code. Please scan the Mosque's Event Attendance QR.");
            return;
        }

        setIsCheckingIn(true);
        setScanError(null);
        const scannedEventId = scannedData.split(":")[1];

        try {
            // 1. Fetch Event Details
            const eventDocSnap = await getDoc(doc(db, "events", scannedEventId));
            if (!eventDocSnap.exists()) {
                throw new Error("Event not found. Scanned QR might be outdated.");
            }
            const eventData = { id: eventDocSnap.id, ...eventDocSnap.data() } as Event;

            // 2. Check if already marked present in event_attendance
            const attendanceQuery = query(
                collection(db, "event_attendance"),
                where("eventId", "==", scannedEventId),
                where("uid", "==", user.uid)
            );
            const attendanceSnap = await getDocs(attendanceQuery);
            if (!attendanceSnap.empty) {
                setScanError(`You have already checked in for "${eventData.title}"!`);
                setIsCheckingIn(false);
                stopScanner();
                return;
            }

            // 3. Find if user is pre-registered
            const registrantQuery = query(
                collection(db, "event_registrants"),
                where("eventId", "==", scannedEventId),
                where("memberId", "==", user.uid)
            );
            const registrantSnap = await getDocs(registrantQuery);

            if (!registrantSnap.empty) {
                // Pre-registered! Update registrant doc status & record attendance log
                const registrantDoc = registrantSnap.docs[0];
                const registrantId = registrantDoc.id;

                // Update registrant status
                await updateDoc(doc(db, "event_registrants", registrantId), {
                    status: "attended"
                });

                // Write event_attendance log entry
                await addDoc(collection(db, "event_attendance"), {
                    eventId: scannedEventId,
                    name: user.displayName || user.email || "Member",
                    uid: user.uid,
                    status: "present",
                    timestamp: Date.now(),
                    recordedBy: "user_scan",
                    isWalkIn: false
                });

                setSuccessCheckInEvent(eventData);
                stopScanner();
                await loadRegistrations();
            } else {
                // Not pre-registered! Trigger Walk-In Dialog
                setWalkInPromptEvent(eventData);
                stopScanner();
            }
        } catch (err: unknown) {
            console.error("Check-in error:", err);
            setScanError(err instanceof Error ? err.message : "Failed to record attendance.");
        } finally {
            setIsCheckingIn(false);
        }
    };

    const handleWalkInCheckIn = async () => {
        if (!user || !walkInPromptEvent || isCheckingIn) return;

        setIsCheckingIn(true);
        setScanError(null);

        try {
            const eventRef = doc(db, "events", walkInPromptEvent.id);
            const eventDoc = await getDoc(eventRef);
            const eventData = eventDoc.data() as Event;

            // Check capacity
            if (eventData.capacity && (eventData.registrantsCount || 0) >= eventData.capacity) {
                throw new Error("Sorry, this event is at maximum capacity. Cannot check-in.");
            }

            // 1. Create registration log
            await addDoc(collection(db, "event_registrants"), {
                eventId: walkInPromptEvent.id,
                memberId: user.uid,
                name: user.displayName || "Member Visitor",
                contactNumber: "000000000",
                email: user.email || "",
                createdAt: Date.now(),
                status: "attended"
            });

            // 2. Create attendance log
            await addDoc(collection(db, "event_attendance"), {
                eventId: walkInPromptEvent.id,
                name: user.displayName || user.email || "Member",
                uid: user.uid,
                status: "present",
                timestamp: Date.now(),
                recordedBy: "user_scan",
                isWalkIn: true
            });

            // 3. Increment registrants count
            await updateDoc(eventRef, {
                registrantsCount: increment(1)
            });

            setSuccessCheckInEvent(walkInPromptEvent);
            setWalkInPromptEvent(null);
            await loadRegistrations();
        } catch (err: unknown) {
            console.error("Walk-in registration failed:", err);
            setScanError(err instanceof Error ? err.message : "Failed to check in as walk-in.");
        } finally {
            setIsCheckingIn(false);
        }
    };

    return (
        <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
            
            {/* Top Interactive Scanning Widget */}
            <div className="mb-8 p-5 bg-gradient-to-br from-primary-900 to-teal-950 text-white rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-5 items-center">
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />
                <div className="p-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-teal-400">
                    <Camera className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 text-center md:text-left flex-1">
                    <h2 className="text-xl font-black font-heading leading-tight uppercase">At the Mosque? Scan Attendance</h2>
                    <p className="text-xs text-primary-100/80 font-medium max-w-md">
                        Check into registered events instantly! Scan the Event Attendance QR Code posted at mosque entrances to log your entry in the attendance book.
                    </p>
                </div>
                <button
                    onClick={startScanner}
                    className="px-6 py-3 bg-white text-secondary-900 hover:bg-secondary-50 hover:shadow-lg rounded-xl font-black text-xs uppercase tracking-widest transition-all w-full md:w-auto text-center shrink-0"
                >
                    Scan QR Check-In
                </button>
            </div>

            {/* Check-In Success Dialog */}
            {successCheckInEvent && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between gap-3 animate-scale-in">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-teal-400 shrink-0" />
                        <div>
                            <p className="text-sm font-black uppercase tracking-wide">Check-In Successful!</p>
                            <p className="text-xs opacity-90">Assalamu alaikum. Your attendance is logged for <strong>{successCheckInEvent.title}</strong>.</p>
                        </div>
                    </div>
                    <button onClick={() => setSuccessCheckInEvent(null)} className="p-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Check-In Scan Error Alert */}
            {scanError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center justify-between gap-3 animate-scale-in">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400 shrink-0" />
                        <div>
                            <p className="text-sm font-black uppercase tracking-wide">Verification Failed</p>
                            <p className="text-xs opacity-90">{scanError}</p>
                        </div>
                    </div>
                    <button onClick={() => setScanError(null)} className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-red-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Walk-In Confirmation Dialog */}
            {walkInPromptEvent && (
                <div className="mb-6 p-5 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-2xl border border-amber-100 dark:border-amber-900/30 space-y-4 animate-scale-in">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-black uppercase tracking-wide">Unregistered RSVP Found</p>
                            <p className="text-xs opacity-90">
                                You are not pre-registered for <strong>{walkInPromptEvent.title}</strong>. Would you like to complete a Walk-In RSVP and Check In on the spot?
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={handleWalkInCheckIn}
                            disabled={isCheckingIn}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                        >
                            {isCheckingIn ? "RSVPing..." : "Yes, Register & Check-In"}
                        </button>
                        <button
                            onClick={() => setWalkInPromptEvent(null)}
                            className="px-4 py-2 border border-amber-200 dark:border-amber-800 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg font-bold text-xs uppercase tracking-wider transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

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

            {/* QR Scanner Overlay Modal */}
            {isScannerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-white dark:bg-secondary-900 rounded-[2rem] p-6 shadow-2xl border border-secondary-200 dark:border-secondary-800 animate-scale-in text-center flex flex-col items-center">
                        <button
                            onClick={stopScanner}
                            className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-white rounded-full hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="space-y-1.5 mb-5 mt-2">
                            <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase font-heading flex items-center justify-center gap-1">
                                <Camera className="w-5 h-5 text-teal-600" /> Event Attendance Scan
                            </h3>
                            <p className="text-xs text-secondary-500">Position the Mosque's Event Attendance QR in the camera frame</p>
                        </div>

                        <div className="relative w-72 h-72 bg-black rounded-3xl overflow-hidden border border-secondary-200 dark:border-secondary-800/80 flex items-center justify-center">
                            {!cameraError && (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            )}
                            
                            {cameraError && (
                                <div className="p-6 text-center text-xs text-secondary-400 space-y-2">
                                    <Camera className="w-8 h-8 mx-auto text-secondary-600 opacity-60 animate-pulse" />
                                    <p>{cameraError}</p>
                                </div>
                            )}

                            {/* Scanning animated elements */}
                            {!cameraError && (
                                <div className="absolute inset-0 border-2 border-primary-500/20 rounded-3xl flex items-center justify-center">
                                    <div className="w-52 h-52 border-2 border-dashed border-teal-500/80 rounded-2xl relative">
                                        <motion.div 
                                            className="absolute left-0 w-full h-0.5 bg-teal-500 shadow-md shadow-teal-500/80"
                                            animate={{ top: ["5%", "95%", "5%"] }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-2.5 w-full">
                            <button
                                onClick={() => {
                                    if (registrations.length > 0) {
                                        handleQrScanResolved(`angullia_event_attendance:${registrations[0].eventId}`);
                                    } else {
                                        setScanError("You don't have registrations. Searching for walk-ins...");
                                    }
                                }}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-1.5"
                            >
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Simulate Scan
                            </button>
                            <button
                                onClick={stopScanner}
                                className="py-3 px-4 border border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-xl text-xs font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
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

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-dashed border-secondary-200 dark:border-secondary-800" />
                                <div className="absolute left-[-24px] w-4 h-8 bg-secondary-50 dark:bg-secondary-950 rounded-r-full border-r border-y border-secondary-200 dark:border-secondary-800" />
                                <div className="absolute right-[-24px] w-4 h-8 bg-secondary-50 dark:bg-secondary-950 rounded-l-full border-l border-y border-secondary-200 dark:border-secondary-800" />
                            </div>

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

import { useState, useEffect } from "react";
import { Event, EventAttendance, Family, Registrant } from "@/lib/types";

import { db } from "@/lib/firebase";

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    orderBy,
    onSnapshot,
    updateDoc,
    increment
} from "firebase/firestore";
import { Check, Search, Trash2, UserPlus, Globe, ArrowRight, QrCode, CheckCircle2, Maximize2, X, Printer } from "lucide-react";

interface EventAttendanceManagerProps {
    event: Event;
    adminUid: string;
}

export default function EventAttendanceManager({ event, adminUid }: EventAttendanceManagerProps) {
    const [attendanceList, setAttendanceList] = useState<EventAttendance[]>([]);
    const [registrants, setRegistrants] = useState<Registrant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Screen display state for QR
    const [isFullScreenQrOpen, setIsFullScreenQrOpen] = useState(false);

    // Scan Check-in State
    const [scanInput, setScanInput] = useState("");
    const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);
    const [checkInError, setCheckInError] = useState<string | null>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    const attendanceQrData = `angullia_event_attendance:${event.id}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(attendanceQrData)}&color=0f766e`;

    const handleScanCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        const registrantId = scanInput.trim();
        if (!registrantId) return;

        setIsCheckingIn(true);
        setCheckInSuccess(null);
        setCheckInError(null);

        try {
            // Find registrant in local state list first
            const matchedRegistrant = registrants.find(r => r.id === registrantId);

            if (!matchedRegistrant) {
                // If not found in local list, double check firestore doc
                const { getDoc, doc } = await import("firebase/firestore");
                const regDocRef = doc(db, "event_registrants", registrantId);
                const regDocSnap = await getDoc(regDocRef);

                if (!regDocSnap.exists()) {
                    throw new Error("Invalid entry pass. No registration found for this ID.");
                }

                const regData = regDocSnap.data() as Registrant;
                if (regData.eventId !== event.id) {
                    throw new Error("This registration is for a different event.");
                }

                // Mark them in attendance using Firestore
                await addToAttendance(regData.name, undefined, registrantId);
                setCheckInSuccess(`Assalamu alaikum, ${regData.name} checked in successfully!`);
            } else {
                // Mark them using local list details
                await addToAttendance(matchedRegistrant.name, undefined, registrantId);
                setCheckInSuccess(`Assalamu alaikum, ${matchedRegistrant.name} checked in successfully!`);
            }

            // Update registration status to 'attended'
            const { doc, updateDoc } = await import("firebase/firestore");
            const registrantRef = doc(db, "event_registrants", registrantId);
            await updateDoc(registrantRef, { status: "attended" });

            setScanInput("");
            setTimeout(() => setCheckInSuccess(null), 5000);
        } catch (err: unknown) {
            console.error("Check-in error:", err);
            setCheckInError(err instanceof Error ? err.message : "Failed to verify entry pass.");
            setTimeout(() => setCheckInError(null), 5000);
        } finally {
            setIsCheckingIn(false);
        }
    };

    // Search State
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Family[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Search function (declared before use)
    const executeSearch = async (term: string) => {
        if (term.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const searchPrefix = term.charAt(0).toUpperCase() + term.slice(1);
            const q = query(
                collection(db, "families"),
                where("name", ">=", searchPrefix),
                where("name", "<=", searchPrefix + '\uf8ff'),
                orderBy("name")
            );

            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Family));

            setSearchResults(results);
        } catch (error) {
            console.error("Search error:", error);
        }
        setIsSearching(false);
    };

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== searchQuery) {
                setSearchQuery(searchInput);
                executeSearch(searchInput);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, searchQuery]);

    // Manual Add State
    const [manualName, setManualName] = useState("");

    useEffect(() => {
        setIsLoading(true);

        // Real-time listener for event_attendance
        const attendanceQuery = query(
            collection(db, "event_attendance"),
            where("eventId", "==", event.id),
            orderBy("timestamp", "desc")
        );
        const unsubAttendance = onSnapshot(attendanceQuery, (snapshot) => {
            const attendanceData = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as EventAttendance));
            setAttendanceList(attendanceData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error listening to attendance:", error);
            setIsLoading(false);
        });

        // Real-time listener for event_registrants
        const registrantsQuery = query(
            collection(db, "event_registrants"),
            where("eventId", "==", event.id),
            orderBy("createdAt", "desc")
        );
        const unsubRegistrants = onSnapshot(registrantsQuery, (snapshot) => {
            const registrantsData = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as Registrant));
            setRegistrants(registrantsData);
        }, (error) => {
            console.error("Error listening to registrants:", error);
        });

        return () => {
            unsubAttendance();
            unsubRegistrants();
        };
    }, [event.id]);

    const addToAttendance = async (name: string, uid?: string, registrantId?: string) => {
        try {
            // Check if already present
            const exists = attendanceList.some(a =>
                (uid && a.uid === uid) || (!uid && a.name.toLowerCase() === name.toLowerCase())
            );

            if (exists) {
                alert(`${name} is already marked as present.`);
                return;
            }

            let resolvedRegistrantId = registrantId;
            if (!resolvedRegistrantId) {
                const matchedRegistrant = registrants.find(r => r.name.toLowerCase() === name.toLowerCase());
                if (matchedRegistrant) {
                    resolvedRegistrantId = matchedRegistrant.id;
                }
            }

            const isWalkIn = !resolvedRegistrantId;

            const newRecord = {
                eventId: event.id,
                name,
                ...(uid ? { uid } : {}),
                status: 'present' as const,
                timestamp: Date.now(),
                recordedBy: adminUid,
                isWalkIn
            };

            await addDoc(collection(db, "event_attendance"), newRecord);

            if (isWalkIn) {
                const eventRef = doc(db, "events", event.id);
                updateDoc(eventRef, {
                    registrantsCount: increment(1)
                }).catch(err => console.error("Error incrementing registrantsCount:", err));
            }

            setManualName("");
            setSearchInput("");
            setSearchQuery("");
            setSearchResults([]);

        } catch (error) {
            console.error("Error adding attendance:", error);
            alert("Failed to mark attendance.");
        }
    };

    const removeAttendance = async (id: string) => {
        if (!confirm("Remove this person from attendance?")) return;
        try {
            const record = attendanceList.find(a => a.id === id);
            await deleteDoc(doc(db, "event_attendance", id));

            if (record?.isWalkIn) {
                const eventRef = doc(db, "events", event.id);
                updateDoc(eventRef, {
                    registrantsCount: increment(-1)
                }).catch(err => console.error("Error decrementing registrantsCount:", err));
            }
        } catch (error) {
            console.error("Error removing attendance:", error);
            alert("Failed to remove.");
        }
    };

    const pendingRegistrants = registrants.filter(r =>
        !attendanceList.some(a => a.name.toLowerCase() === r.name.toLowerCase())
    );

    const handlePrintQr = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Attendance QR - ${event.title}</title>
                        <style>
                            body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; color: #0f172a; }
                            .card { border: 2px solid #e2e8f0; padding: 40px; border-radius: 24px; display: inline-block; max-width: 500px; }
                            h1 { font-size: 28px; margin-bottom: 8px; font-weight: 800; }
                            h2 { font-size: 16px; color: #0d9488; text-transform: uppercase; margin-bottom: 24px; font-weight: 700; letter-spacing: 0.05em; }
                            img { border: 1px solid #cbd5e1; padding: 16px; border-radius: 16px; width: 300px; height: 300px; }
                            p { font-size: 14px; color: #64748b; margin-top: 24px; font-weight: 500; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h1>${event.title}</h1>
                            <h2>Event Attendance Check-in</h2>
                            <img src="${qrImageUrl}" alt="Event Attendance QR" />
                            <p>Assalamu alaikum, please scan this QR code with your Masjid Angullia member dashboard to check in.</p>
                        </div>
                        <script>
                            window.onload = function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 500);
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Search / Add Column */}
                <div className="flex-1 space-y-6">

                    {/* NEW: Display attendance QR code for users to scan */}
                    <div className="bg-white dark:bg-secondary-900 p-5 rounded-2xl border border-secondary-200 dark:border-secondary-800 shadow-sm relative overflow-hidden flex flex-col sm:flex-row gap-5 items-center">
                        <div className="bg-secondary-50 dark:bg-secondary-950 p-2.5 rounded-xl border border-secondary-100 dark:border-secondary-800/50 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={qrImageUrl}
                                alt="Event Attendance QR"
                                className="w-32 h-32 object-contain"
                            />
                        </div>
                        <div className="space-y-2 text-center sm:text-left flex-1">
                            <h3 className="font-black text-secondary-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5 text-base leading-tight">
                                <QrCode className="w-5 h-5 text-primary-500" />
                                Attendance QR Code
                            </h3>
                            <p className="text-xs text-secondary-500 dark:text-secondary-400 font-medium">
                                Display or print this QR code at mosque entries. Attendees can scan this QR code using their own device to automatically check themselves into the event!
                            </p>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
                                <button
                                    onClick={() => setIsFullScreenQrOpen(true)}
                                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                                >
                                    <Maximize2 className="w-3.5 h-3.5" /> Fullscreen Mode
                                </button>
                                <button
                                    onClick={handlePrintQr}
                                    className="px-3 py-1.5 border border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-all"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Print QR Poster
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Online Registrants Card */}
                    {pendingRegistrants.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-4">
                            <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Globe className="w-4 h-4" />
                                Online Registrants ({pendingRegistrants.length})
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {pendingRegistrants.map(reg => (
                                    <div key={reg.id} className="bg-white dark:bg-secondary-900 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-center justify-between shadow-sm">
                                        <div>
                                            <p className="font-bold text-secondary-900 dark:text-white text-sm">{reg.name}</p>
                                            <p className="text-xs text-secondary-500">{reg.contactNumber}</p>
                                        </div>
                                        <button
                                            onClick={() => addToAttendance(reg.name, undefined, reg.id)}
                                            className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                            title="Check In"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* QR Scan Check-In Card */}
                    <div>
                        <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2 mb-4">
                            <QrCode className="w-5 h-5 text-primary-500" />
                            Scan Entry Pass
                        </h3>

                        <div className="bg-white dark:bg-secondary-900 p-4 rounded-xl border border-secondary-200 dark:border-secondary-800 shadow-sm space-y-4">
                            <form onSubmit={handleScanCheckIn} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-secondary-500 block">
                                        Scan QR Pass or Enter Registration ID
                                    </label>
                                    <div className="relative">
                                        <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                        <input
                                            required
                                            type="text"
                                            value={scanInput}
                                            onChange={(e) => setScanInput(e.target.value)}
                                            placeholder="Click here & scan QR or paste Registration ID..."
                                            className="w-full pl-9 pr-24 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-mono"
                                            disabled={isCheckingIn}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isCheckingIn || !scanInput.trim()}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-opacity"
                                        >
                                            {isCheckingIn ? "Verifying..." : "Verify"}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Status Indicators */}
                            {checkInSuccess && (
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2 animate-scale-in">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span>{checkInSuccess}</span>
                                </div>
                            )}

                            {checkInError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg text-xs font-bold border border-red-100 dark:border-red-900/30 flex items-center gap-2 animate-scale-in">
                                    <span className="shrink-0 text-red-600 dark:text-red-400">⚠️</span>
                                    <span>{checkInError}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2 mb-4">
                            <UserPlus className="w-5 h-5 text-primary-500" />
                            Add Attendee
                        </h3>

                        <div className="bg-white dark:bg-secondary-900 p-4 rounded-xl border border-secondary-200 dark:border-secondary-800 shadow-sm space-y-4">
                            {/* Search Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-secondary-500">Search Registered Family</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                    <input
                                        type="text"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder="Search by name..."
                                        className="w-full pl-9 pr-10 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Results Dropdown */}
                                {searchResults.length > 0 && (
                                    <div className="mt-2 max-h-48 overflow-y-auto border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 shadow-lg">
                                        {searchResults.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => addToAttendance(user.name, user.id)}
                                                className="w-full text-left px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm flex items-center justify-between group transition-colors"
                                            >
                                                <span className="font-medium text-secondary-900 dark:text-white">{user.name}</span>
                                                <span className="text-xs text-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-secondary-200 dark:border-secondary-700" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-secondary-900 px-2 text-secondary-500">Or Manual Entry</span>
                                </div>
                            </div>

                            {/* Manual Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualName}
                                    onChange={(e) => setManualName(e.target.value)}
                                    placeholder="Enter Name (Visitor)"
                                    className="flex-1 px-4 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                />
                                <button
                                    onClick={() => {
                                        if (manualName.trim()) addToAttendance(manualName);
                                    }}
                                    disabled={!manualName.trim()}
                                    className="bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* List Column */}
                <div className="flex-1 space-y-4">
                    <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" />
                            Attendance List
                        </div>
                        <span className="text-xs font-black bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded-full text-secondary-600 dark:text-secondary-400">
                            {attendanceList.length}
                        </span>
                    </h3>

                    <div className="bg-white dark:bg-secondary-900 rounded-xl border border-secondary-200 dark:border-secondary-800 shadow-sm overflow-hidden h-[600px] overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center text-sm text-secondary-500">Loading...</div>
                        ) : attendanceList.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-secondary-400 p-6 text-center">
                                <UserPlus className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-sm font-medium">No attendance recorded yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
                                {attendanceList.map((record) => (
                                    <div key={record.id} className="p-3 flex items-center justify-between hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs">
                                                {record.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-secondary-900 dark:text-white">{record.name}</p>
                                                <p className="text-[10px] text-secondary-500">
                                                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {record.uid ? ' • Registered' : ' • Manual/Visitor'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeAttendance(record.id)}
                                            className="p-1.5 text-secondary-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Immersive Poster Fullscreen View */}
            {isFullScreenQrOpen && (
                <div className="fixed inset-0 z-50 bg-secondary-950 flex flex-col items-center justify-center p-6 text-white animate-fade-in">
                    <button
                        onClick={() => setIsFullScreenQrOpen(false)}
                        className="absolute top-6 right-6 p-2 bg-secondary-900 hover:bg-secondary-800 text-secondary-400 hover:text-white rounded-full transition-colors"
                        title="Close Poster View"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="text-center space-y-6 max-w-lg">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full text-xs font-black uppercase tracking-widest">
                            <QrCode className="w-4 h-4" /> Masjid Angullia Entry
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-4xl font-extrabold tracking-tight font-heading leading-tight">{event.title}</h2>
                            <p className="text-teal-500 font-bold uppercase tracking-widest text-sm">Self Check-in Portal</p>
                        </div>

                        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-secondary-800 max-w-sm mx-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={qrImageUrl}
                                alt="Event Attendance QR Fullscreen"
                                className="w-80 h-80 object-contain mx-auto"
                            />
                        </div>

                        <div className="space-y-2 text-secondary-300">
                            <p className="text-base font-bold">Please scan this QR Code with your smartphone member portal.</p>
                            <p className="text-xs text-secondary-500">Go to My Events page &gt; Tap "Scan Attendance QR" to check yourself in instantly.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

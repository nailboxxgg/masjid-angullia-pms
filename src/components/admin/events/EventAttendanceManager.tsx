
import { useState, useEffect } from "react";
import { Event, EventAttendance, Family } from "@/lib/types";
import { db } from "@/lib/firebase";
import { getRegistrants, Registrant } from "@/lib/events";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    orderBy
} from "firebase/firestore";
import { Check, Search, Trash2, UserPlus, X, Globe, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventAttendanceManagerProps {
    event: Event;
    adminUid: string;
}

export default function EventAttendanceManager({ event, adminUid }: EventAttendanceManagerProps) {
    const [attendanceList, setAttendanceList] = useState<EventAttendance[]>([]);
    const [registrants, setRegistrants] = useState<Registrant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Family[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Manual Add State
    const [manualName, setManualName] = useState("");

    useEffect(() => {
        loadData();
    }, [event.id]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load Attendance
            const q = query(
                collection(db, "event_attendance"),
                where("eventId", "==", event.id),
                orderBy("timestamp", "desc")
            );
            const snapshot = await getDocs(q);
            const attendanceData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as EventAttendance));
            setAttendanceList(attendanceData);

            // Load Online Registrants
            const registrantsData = await getRegistrants(event.id);
            setRegistrants(registrantsData);

        } catch (error) {
            console.error("Error loading event data:", error);
        }
        setIsLoading(false);
    };

    const handleSearch = async (term: string) => {
        setSearchQuery(term);
        if (term.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Using a prefix search strategy
            const q = query(
                collection(db, "families"),
                where("name", ">=", term),
                where("name", "<=", term + '\uf8ff'),
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

            const newRecord: Omit<EventAttendance, "id"> = {
                eventId: event.id,
                name,
                uid,
                status: 'present',
                timestamp: Date.now(),
                recordedBy: adminUid
            };

            const docRef = await addDoc(collection(db, "event_attendance"), newRecord);

            setAttendanceList(prev => [{ ...newRecord, id: docRef.id } as EventAttendance, ...prev]);

            // Clear inputs
            setManualName("");
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
            await deleteDoc(doc(db, "event_attendance", id));
            setAttendanceList(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error("Error removing attendance:", error);
            alert("Failed to remove.");
        }
    };

    // Filter registrants who are NOT in attendance list
    // Matching by name is risky but acceptable for v1 if uid isn't consistent.
    // Ideally we match by a unique ID if available, otherwise name.
    const pendingRegistrants = registrants.filter(r =>
        !attendanceList.some(a => a.name.toLowerCase() === r.name.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Search / Add Column */}
                <div className="flex-1 space-y-6">

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
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Search by name..."
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                    />
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

                    <div className="bg-white dark:bg-secondary-900 rounded-xl border border-secondary-200 dark:border-secondary-800 shadow-sm overflow-hidden h-[500px] overflow-y-auto">
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
        </div>
    );
}

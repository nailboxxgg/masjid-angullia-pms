"use client";

import { useState, useEffect } from "react";
import {
    Clock,
    Calendar,
    Search,
    Filter,
    Download,
    User,
    ArrowUpDown,
    MoreHorizontal,
    CheckCircle2,
    Timer,
    Monitor,
    History as HistoryIcon,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAttendanceSessions, getTodayDateString } from "@/lib/attendance";
import { addManualAttendance, getStaffList } from "@/lib/staff";
import { AttendanceSession, Staff } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import Modal from "@/components/ui/modal";
import { Plus } from "lucide-react";
import { getSubscribers, Subscriber } from "@/lib/notifications";

interface ConsolidatedStaffSession extends Omit<AttendanceSession, 'status' | 'role'> {
    totalDurationMs: number;
    sessionsCount: number;
    latestClockIn: number;
    latestClockOut?: number;
    isActive: boolean;
    displayDuration?: string;
    displayTime?: string;
    status: string;
    role?: string;
}

export default function AdminAttendancePage() {
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getTodayDateString());
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'staff' | 'visitor'>('visitor');

    // Manual Entry State
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [manualForm, setManualForm] = useState({
        staffId: "",
        date: getTodayDateString(),
        clockIn: "08:00",
        clockOut: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchStaff = async () => {
            const staff = await getStaffList();
            setStaffList(staff);
        };
        fetchStaff();
    }, []);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await addManualAttendance(
                manualForm.staffId,
                manualForm.date,
                manualForm.clockIn,
                manualForm.clockOut || undefined
            );

            if (result.success) {
                setIsManualModalOpen(false);
                fetchSessions(); // Refresh list
                setManualForm({
                    staffId: "",
                    date: getTodayDateString(),
                    clockIn: "08:00",
                    clockOut: ""
                });
                alert("Attendance recorded successfully!");
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = () => {
        let exportData: Record<string, string | undefined>[] = [];

        if (activeTab === 'visitor') {
            exportData = visitorSessions.map(session => ({
                'Name': session.displayName,
                'Phone': session.phone || 'N/A',
                'Time': new Date(session.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                'Date': new Date(session.clockIn).toLocaleDateString(),
                'Device': session.deviceInfo || 'Unknown'
            }));
        } else {
            exportData = finalStaffList.map(staff => ({
                'Name': staff.displayName,
                'Email': staff.email,
                'Role': staff.role || 'Staff',
                'Status': staff.status === 'active' ? 'Active' : 'Completed',
                'Time Info': staff.displayTime,
                'Total Duration': staff.displayDuration,
                'Latest Activity': new Date(staff.latestClockOut || staff.latestClockIn).toLocaleString()
            }));
        }

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === 'visitor' ? "Visitor Logs" : "Staff Attendance");

        // Set column widths
        const wscols = activeTab === 'visitor'
            ? [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 30 }]
            : [{ wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 25 }];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `MASJID_${activeTab}_LOGS_${selectedDate}.xlsx`);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 }
        },
        hover: {
            y: -5,
            transition: { duration: 0.2 }
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [selectedDate]);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const data = await getAttendanceSessions(selectedDate);
            setSessions(data);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter sessions based on search
    const filteredRawSessions = sessions.filter(session => {
        return session.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (session.email && session.email.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const visitorSessions = filteredRawSessions.filter(s => s.type === 'visitor_log');
    const staffSessionsRaw = filteredRawSessions.filter(s => s.type === 'staff_session');

    // Consolidate Staff Sessions
    const consolidatedStaffSessions = Object.values(staffSessionsRaw.reduce((acc, session) => {
        const key = session.staffId || session.uid || session.id;
        if (!acc[key]) {
            acc[key] = {
                ...session,
                totalDurationMs: 0,
                sessionsCount: 0,
                latestClockIn: session.clockIn,
                latestClockOut: session.clockOut,
                isActive: false
            };
        }

        // Aggregate stats
        const record = acc[key];
        record.sessionsCount++;
        if (session.clockIn > record.latestClockIn) record.latestClockIn = session.clockIn;
        if (session.clockOut && (!record.latestClockOut || session.clockOut > record.latestClockOut)) {
            record.latestClockOut = session.clockOut;
        }

        // Status check (if any session is active, user is active)
        if (session.status === 'active') record.isActive = true;

        // Calculate partial duration
        if (session.clockOut) {
            record.totalDurationMs += (session.clockOut - session.clockIn);
        } else if (session.status === 'active') {
            // Add time until now for active session? Or just leave it?
            // Usually we show "On-going" + accumulated past duration
            record.totalDurationMs += (Date.now() - session.clockIn);
        }

        return acc;
    }, {} as Record<string, ConsolidatedStaffSession>));

    const finalStaffList = consolidatedStaffSessions.map(staff => {
        const hours = Math.floor(staff.totalDurationMs / (1000 * 60 * 60));
        const minutes = Math.floor((staff.totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));

        return {
            ...staff,
            displayDuration: staff.isActive ? `On-going (${hours}h ${minutes}m)` : `${hours}h ${minutes}m`,
            status: (staff.isActive ? 'active' : 'completed') as AttendanceSession['status'],
            // For Time column, show First In - Last Out? Or Latest activity?
            // User asked: "record only the status, time and duration"
            // Let's show: Latest Activity Time
            displayTime: staff.isActive
                ? `In at ${new Date(staff.latestClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Out at ${new Date(staff.latestClockOut || staff.latestClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        };
    });


    const displayData = (activeTab === 'visitor' ? visitorSessions : finalStaffList) as (AttendanceSession & Partial<ConsolidatedStaffSession>)[];
    const activeSessionsCount = sessions.filter(s => s.status === 'active').length;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-10"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div variants={itemVariants}>
                    <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white">Attendance</h1>
                    <p className="text-secondary-900 dark:text-secondary-200 mt-1 font-medium italic text-balance">Real-time monitoring of masjid staff presence and working hours.</p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-900 dark:text-secondary-200" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-secondary-50 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-500 dark:placeholder:text-secondary-400 shadow-sm"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsManualModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 shadow-sm transition-all"
                    >
                        <Plus className="w-4 h-4" /> Manual Entry
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 rounded-xl text-sm font-bold hover:bg-secondary-50 dark:hover:bg-secondary-800 shadow-sm transition-all"
                    >
                        <Download className="w-4 h-4" /> Export Excel
                    </motion.button>
                </motion.div>
            </div>

            {/* Manual Entry Modal */}
            <Modal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                title="Manual Attendance Entry"
                className="max-w-md"
            >
                <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-1">Staff Member</label>
                        <select
                            required
                            value={manualForm.staffId}
                            onChange={(e) => setManualForm({ ...manualForm, staffId: e.target.value })}
                            className="w-full p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
                        >
                            <option value="">Select Staff</option>
                            {staffList.map(staff => (
                                <option key={staff.id} value={staff.id}>
                                    {staff.name} ({staff.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-1">Date</label>
                        <input
                            type="date"
                            required
                            value={manualForm.date}
                            onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                            className="w-full p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-1">Clock In Time</label>
                            <input
                                type="time"
                                required
                                value={manualForm.clockIn}
                                onChange={(e) => setManualForm({ ...manualForm, clockIn: e.target.value })}
                                className="w-full p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-1">Clock Out Time <span className="text-secondary-400 font-normal text-xs">(Optional)</span></label>
                            <input
                                type="time"
                                value={manualForm.clockOut}
                                onChange={(e) => setManualForm({ ...manualForm, clockOut: e.target.value })}
                                className="w-full p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsManualModalOpen(false)}
                            className="px-4 py-2 text-sm font-bold text-secondary-600 hover:bg-secondary-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Save Record"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-primary-500 shadow-sm hover:shadow-md bg-white dark:bg-secondary-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Active Now</CardTitle>
                        <User className="h-4 w-4 text-primary-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSessionsCount}</div>
                        <p className="text-xs text-secondary-400 mt-1">Staff currently clocked in</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md bg-white dark:bg-secondary-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Total Entries</CardTitle>
                        <HistoryIcon className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sessions.length}</div>
                        <p className="text-xs text-secondary-400 mt-1">Records for {selectedDate}</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md bg-white dark:bg-secondary-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Completion Rate</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {sessions.length > 0
                                ? Math.round((sessions.filter(s => s.status === 'completed').length / sessions.length) * 100)
                                : 0}%
                        </div>
                        <p className="text-xs text-secondary-400 mt-1">Completed sessions</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-slate-400 shadow-sm hover:shadow-md bg-white dark:bg-secondary-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Devices Used</CardTitle>
                        <Monitor className="h-4 w-4 text-secondary-900 dark:text-secondary-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Mobile/Web</div>
                        <p className="text-xs font-semibold text-secondary-900 dark:text-secondary-200 mt-1">Dominant platform: Mobile</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-secondary-100 dark:bg-secondary-800 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('visitor')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === 'visitor'
                            ? "bg-white dark:bg-secondary-900 text-primary-600 dark:text-primary-400 shadow-sm"
                            : "text-secondary-500 hover:text-secondary-900 dark:hover:text-secondary-100"
                    )}
                >
                    Visitor Logs
                </button>
                <button
                    onClick={() => setActiveTab('staff')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === 'staff'
                            ? "bg-white dark:bg-secondary-900 text-primary-600 dark:text-primary-400 shadow-sm"
                            : "text-secondary-500 hover:text-secondary-900 dark:hover:text-secondary-100"
                    )}
                >
                    Staff Attendance
                </button>
            </div>

            {/* Filters & Search */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-secondary-900 p-4 rounded-xl border border-secondary-100 dark:border-secondary-800 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-900 dark:text-secondary-200" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-secondary-950 border-none rounded-lg text-sm outline-none ring-1 ring-secondary-200 dark:ring-secondary-800 focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                {activeTab === 'staff' && (
                    <div className="flex items-center gap-2 shrink-0">
                        <button className="p-2 text-secondary-900 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors border border-secondary-200 dark:border-secondary-800">
                            <Filter className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors border border-secondary-200 dark:border-secondary-800">
                            <ArrowUpDown className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Table Card */}
            {/* Data Display - Responsive Card/Table Wrapper */}
            <div className="space-y-4">
                {/* Mobile View: Cards */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-secondary-900 rounded-2xl p-5 border border-secondary-100 dark:border-secondary-800 animate-pulse space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-24 bg-secondary-100 dark:bg-secondary-800 rounded"></div>
                                        <div className="h-3 w-16 bg-secondary-100 dark:bg-secondary-800 rounded"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="h-8 bg-secondary-100 dark:bg-secondary-800 rounded-lg"></div>
                                    <div className="h-8 bg-secondary-100 dark:bg-secondary-800 rounded-lg"></div>
                                </div>
                            </div>
                        ))
                    ) : displayData.length === 0 ? (
                        <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-200 dark:border-secondary-800 p-10 text-center">
                            <Clock className="w-12 h-12 text-secondary-200 dark:text-secondary-800 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white uppercase tracking-tight">No records</h3>
                            <p className="text-secondary-500 text-sm mt-1 font-medium italic">Try adjusting filters</p>
                        </div>
                    ) : (
                        displayData.map((session) => (
                            <motion.div
                                key={session.id}
                                variants={itemVariants}
                                whileHover={{ y: -2 }}
                                className="bg-white dark:bg-secondary-900 rounded-2xl p-5 border border-secondary-100 dark:border-secondary-800 shadow-sm relative overflow-hidden group"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-base ring-2 ring-white dark:ring-secondary-800 shadow-sm">
                                            {session.displayName ? session.displayName[0] : '?'}
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-secondary-900 dark:text-white leading-tight">{session.displayName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                                                    {activeTab === 'visitor' ? 'Visitor' : 'Staff Member'}
                                                </span>
                                                {activeTab === 'staff' && (
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-tighter",
                                                        session.role === 'admin' ? "bg-red-50 text-red-600 dark:bg-red-900/20" :
                                                            session.role === 'volunteer' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" :
                                                                "bg-slate-50 text-slate-600 dark:bg-slate-900/20"
                                                    )}>
                                                        {session.role || 'Staff'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                        session.status === 'active'
                                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50"
                                            : "bg-secondary-50 dark:bg-secondary-800/50 text-secondary-500 dark:text-secondary-400 border-secondary-100 dark:border-secondary-700"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full", session.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-secondary-400")} />
                                        {session.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Time Info</p>
                                        <div className="flex items-center gap-2 text-sm font-bold text-secondary-700 dark:text-secondary-200">
                                            <Clock className="w-3.5 h-3.5 text-primary-500" />
                                            {activeTab === 'visitor'
                                                ? new Date(session.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : session.displayTime
                                            }
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                                            {activeTab === 'visitor' ? 'Contact' : 'Duration'}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm font-bold text-secondary-700 dark:text-secondary-200">
                                            {activeTab === 'visitor' ? (
                                                <Monitor className="w-3.5 h-3.5 text-blue-500" />
                                            ) : (
                                                <Timer className="w-3.5 h-3.5 text-amber-500" />
                                            )}
                                            <span className="truncate">
                                                {activeTab === 'visitor' ? (session.phone || "No Phone") : session.displayDuration}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* PC View: Table */}
                <Card className="hidden md:block border-none shadow-xl overflow-hidden bg-white dark:bg-secondary-900 rounded-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-secondary-50/50 dark:bg-secondary-950 border-b border-secondary-100 dark:border-secondary-800 font-bold uppercase tracking-widest text-[10px] text-secondary-500">
                                    <th className="px-6 py-4">User / Type</th>
                                    {activeTab === 'staff' ? (
                                        <>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Time</th>
                                            <th className="px-6 py-4">Duration</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-4">Phone</th>
                                            <th className="px-6 py-4">Date & Time</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 w-32 bg-secondary-100 dark:bg-secondary-800 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-20 bg-secondary-100 dark:bg-secondary-800 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-24 bg-secondary-100 dark:bg-secondary-800 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-24 bg-secondary-100 dark:bg-secondary-800 rounded"></div></td>
                                            {activeTab === 'staff' && (
                                                <>
                                                    <td className="px-6 py-4"><div className="h-4 w-20 bg-secondary-100 dark:bg-secondary-800 rounded"></div></td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                ) : displayData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center">
                                            <div className="max-w-xs mx-auto opacity-40">
                                                <Clock className="w-12 h-12 mx-auto mb-4" />
                                                <p className="font-bold uppercase tracking-widest text-xs">No records found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayData.map((session) => (
                                        <tr key={session.id} className="hover:bg-secondary-50/50 dark:hover:bg-white/5 group transition-all cursor-default">
                                            <td className="px-6 py-4 relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-secondary-900 dark:text-white font-black text-xs ring-2 ring-white dark:ring-secondary-700 shadow-sm group-hover:scale-110 transition-transform">
                                                        {session.displayName ? session.displayName[0] : '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors uppercase tracking-tight">{session.displayName}</p>
                                                        <div className="text-[9px] font-black text-secondary-400 uppercase tracking-widest mt-0.5">
                                                            {activeTab === 'visitor' ? 'Visitor' : 'Staff Member'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            {activeTab === 'staff' ? (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                                                            session.role === 'admin' ? "bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30" :
                                                                session.role === 'volunteer' ? "bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30" :
                                                                    "bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-900/20 dark:border-slate-800"
                                                        )}>
                                                            {session.role || 'Staff'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border whitespace-nowrap",
                                                            session.status === 'active'
                                                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50"
                                                                : "bg-secondary-50 dark:bg-secondary-800/50 text-secondary-500 dark:text-secondary-400 border-secondary-100 dark:border-secondary-700"
                                                        )}>
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", session.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-secondary-400")} />
                                                            {session.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm font-bold text-secondary-700 dark:text-secondary-100">
                                                            <Clock className="w-3.5 h-3.5 text-primary-500" />
                                                            {session.displayTime}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-xs font-black text-secondary-600 dark:text-secondary-400 uppercase tracking-tighter">
                                                            <Timer className="w-3.5 h-3.5 text-amber-500" />
                                                            {session.displayDuration}
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 font-bold text-secondary-900 dark:text-white">
                                                        {session.phone || "No Phone"}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-tight">
                                                                {new Date(session.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest">
                                                                {new Date(session.clockIn).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* SMS Subscribers */}
            <SubscriberManager />
        </motion.div>
    );
}

function SubscriberManager() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await getSubscribers();
            setSubscribers(data);
            setIsLoading(false);
        };
        load();
    }, []);

    return (
        <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm transition-all hover:shadow-2xl hover:border-primary-200 dark:hover:border-primary-900/50 rounded-2xl overflow-hidden group">
            <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4 bg-secondary-50/30 dark:bg-secondary-800/20 group-hover:bg-secondary-50/80 dark:group-hover:bg-secondary-800/40 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl dark:bg-blue-900/20 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-800/50">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-secondary-900 dark:text-white uppercase tracking-tight">SMS Subscribers</CardTitle>
                        <CardDescription className="text-secondary-500 font-medium text-xs mt-0.5">Manage community members subscribed to text alerts.</CardDescription>
                    </div>
                    <div className="ml-auto bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full border border-primary-100 dark:border-primary-800/50">
                        <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">{subscribers.length} ACTIVE</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {isLoading ? (
                        <p className="text-center text-sm text-secondary-500 py-4">Loading list...</p>
                    ) : subscribers.length === 0 ? (
                        <p className="text-center text-sm text-secondary-500 py-4">No subscribers yet.</p>
                    ) : (
                        subscribers.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800/30 rounded-lg border border-secondary-100 dark:border-secondary-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                        PH
                                    </div>
                                    <div>
                                        <p className="font-bold text-secondary-900 dark:text-white text-sm">{sub.phoneNumber}</p>
                                        <p className="text-[10px] text-secondary-500">
                                            Joined {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

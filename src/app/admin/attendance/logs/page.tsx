"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Search, User, Download, Filter } from "lucide-react";
import { collection, query, orderBy, getDocs, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AttendanceRecord } from "@/lib/types";
import AnimationWrapper from "@/components/ui/AnimationWrapper";

export default function AttendanceLogsPage() {
    const [logs, setLogs] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    useEffect(() => {
        loadLogs();
    }, [dateFilter]);

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            let q = query(collection(db, "attendance_logs"), orderBy("timestamp", "desc"), limit(100));

            if (dateFilter) {
                // If filtering by date, we might need a compound index or client-side filter
                // For simplicity/speed without index creation, let's filter client side or use simple query
                // Firestore exact match on date string
                q = query(collection(db, "attendance_logs"), where("date", "==", dateFilter), orderBy("timestamp", "desc"));
            }

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => doc.data() as AttendanceRecord);
            setLogs(data);
        } catch (error) {
            console.error("Error loading logs:", error);
        }
        setIsLoading(false);
    };

    const filteredLogs = logs.filter(log =>
        log.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.staffId && log.staffId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-secondary-900 dark:text-white font-heading tracking-tight mb-2">
                        Attendance Logs
                    </h1>
                    <p className="text-secondary-500 dark:text-secondary-400 text-lg font-medium">
                        History of staff clock-in and clock-out events.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                    <input
                        type="text"
                        placeholder="Search by name or Staff ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-secondary-900 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50 dark:bg-secondary-950 border-b border-secondary-100 dark:border-secondary-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-secondary-500 uppercase tracking-widest">Time</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-secondary-500 uppercase tracking-widest">Staff Name</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-secondary-500 uppercase tracking-widest">Action</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-secondary-500 uppercase tracking-widest">Staff ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-secondary-100 dark:bg-secondary-800 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-secondary-100 dark:bg-secondary-800 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-secondary-100 dark:bg-secondary-800 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-secondary-100 dark:bg-secondary-800 rounded w-24"></div></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-secondary-500">
                                        No attendance records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-secondary-900 dark:text-white">
                                                    {format(log.timestamp, 'hh:mm a')}
                                                </span>
                                                <span className="text-xs text-secondary-500">
                                                    {format(log.timestamp, 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xs ring-2 ring-white dark:ring-secondary-900">
                                                    {log.displayName.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-secondary-900 dark:text-white">
                                                    {log.displayName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${log.type === 'clock_in'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                                                    : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300'
                                                }`}>
                                                {log.type === 'clock_in' ? 'Clock In' : 'Clock Out'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 font-mono">
                                            {log.staffId || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

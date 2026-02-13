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
import { AttendanceSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function AdminAttendancePage() {
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getTodayDateString());
    const [searchTerm, setSearchTerm] = useState("");

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

    const filteredSessions = sessions.filter(session =>
        session.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeSessionsCount = sessions.filter(s => s.status === 'active').length;

    // Calculate total hours logged today
    // Parse duration strings roughly "Xh Ym"
    // This is just a visual stat, approximate is fine or skipped if complex
    // Let's stick to simple stats for now

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
                    <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white">Staff Attendance</h1>
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
                        className="inline-flex items-center gap-2 px-6 py-2 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 rounded-xl text-sm font-bold hover:bg-secondary-50 dark:hover:bg-secondary-800 shadow-sm transition-all"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </motion.button>
                </motion.div>
            </div>

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
                        <CardTitle className="text-sm font-medium text-secondary-500">Total Sessions</CardTitle>
                        <HistoryIcon className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sessions.length}</div>
                        <p className="text-xs text-secondary-400 mt-1">Sessions for {selectedDate}</p>
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
                <div className="flex items-center gap-2 shrink-0">
                    <button className="p-2 text-secondary-900 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors border border-secondary-200 dark:border-secondary-800">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors border border-secondary-200 dark:border-secondary-800">
                        <ArrowUpDown className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>

            {/* Table Card */}
            <Card className="border-none shadow-xl overflow-hidden bg-white dark:bg-secondary-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary-50 dark:bg-secondary-950 border-b border-secondary-100 dark:border-secondary-800">
                                <th className="px-6 py-4 text-xs font-bold text-secondary-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-secondary-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-secondary-500 uppercase tracking-wider">Clock In</th>
                                <th className="px-6 py-4 text-xs font-bold text-secondary-500 uppercase tracking-wider">Clock Out</th>
                                <th className="px-6 py-4 text-xs font-bold text-secondary-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-4 text-xs font-bold text-secondary-500 uppercase tracking-wider text-right">Actions</th>
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
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-secondary-100 dark:bg-secondary-800 rounded"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 w-8 bg-secondary-100 dark:bg-secondary-800 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20">
                                        <div className="bg-white dark:bg-secondary-900 rounded-xl border border-secondary-200 dark:border-secondary-800 p-12 text-center">
                                            <Clock className="w-12 h-12 text-secondary-200 dark:text-secondary-800 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">No attendance sessions</h3>
                                            <p className="text-secondary-900 dark:text-secondary-200 font-medium mt-1">Try adjusting your search or filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-secondary-50 dark:hover:bg-white/5 group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-secondary-900 dark:text-white font-bold text-xs ring-2 ring-white dark:ring-secondary-700 shadow-sm">
                                                    {session.displayName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-secondary-900 dark:text-white">{session.displayName}</p>
                                                    <div className="text-xs font-medium text-secondary-600 dark:text-secondary-400">{session.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border",
                                                session.status === 'active'
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50"
                                                    : "bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 border-secondary-200 dark:border-secondary-700"
                                            )}>
                                                {session.status === 'active'
                                                    ? <><CheckCircle2 className="w-3 h-3" /> Active</>
                                                    : <><CheckCircle2 className="w-3 h-3" /> Completed</>
                                                }
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-secondary-900 dark:text-secondary-100">
                                                <Clock className="w-3.5 h-3.5 text-secondary-400 dark:text-secondary-500" />
                                                {new Date(session.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {session.clockOut ? (
                                                <div className="flex items-center gap-2 text-sm font-semibold text-secondary-900 dark:text-secondary-100">
                                                    <LogOut className="w-3.5 h-3.5 text-secondary-400 dark:text-secondary-500" />
                                                    {new Date(session.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-secondary-400 italic">-- : --</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-secondary-700 dark:text-secondary-300">
                                                <Timer className="w-3.5 h-3.5" />
                                                {session.duration || "On-going"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded-md transition-colors text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </motion.div>
    );
}

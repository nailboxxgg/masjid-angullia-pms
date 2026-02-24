"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getFeedbacksByType, FeedbackData } from "@/lib/feedback";
import { getDonationStatsAction } from "@/app/actions/donations";
import { DonationStats } from "@/lib/donations";
import { getEvents } from "@/lib/events";
import { countFamilies } from "@/lib/families";
import { Event } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";


export default function AdminDashboard() {
    const [stats, setStats] = useState<DonationStats>({
        totalCollected: 0,
        monthlyCollected: 0,
        breakdown: {},
        recentDonations: []
    });
    const [pendingRequests, setPendingRequests] = useState<FeedbackData[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [recentRequests, setRecentRequests] = useState<FeedbackData[]>([]);
    const [totalFamilies, setTotalFamilies] = useState(0);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        hover: {
            y: -5,
            transition: { duration: 0.2 }
        }
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            const [donationStats, requests, events, familyCount] = await Promise.all([
                getDonationStatsAction(),
                getFeedbacksByType('Request'),
                getEvents(5),
                countFamilies()
            ]);

            setStats(donationStats);
            setPendingRequests(requests.filter((r: FeedbackData) => r.status === 'New'));
            setRecentRequests(requests.slice(0, 3));
            setUpcomingEvents(events);
            setTotalFamilies(familyCount);
        };

        loadDashboardData();
    }, []);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <motion.div variants={itemVariants}>
                    <h1 className="text-4xl font-black tracking-tighter text-secondary-900 dark:text-white uppercase">
                        Admin Dashboard
                    </h1>
                    <p className="text-secondary-500 dark:text-secondary-400 mt-1 font-medium italic text-lg">Welcome back. Monitoring masjid operations and progress.</p>
                </motion.div>
                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <Link href="/admin/families" className="flex-1 lg:flex-none inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 h-12 px-6 shadow-sm transition-all hover:shadow-md">
                        <Users className="mr-2 h-4 w-4 text-primary-500" /> Register Family
                    </Link>
                    <Link href="/admin/events/new" className="flex-1 lg:flex-none inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest bg-primary-600 dark:bg-primary-700 text-white hover:bg-primary-700 dark:hover:bg-primary-800 h-12 px-6 shadow-xl shadow-primary-500/20 transition-all hover:scale-105 active:scale-95">
                        <Calendar className="mr-2 h-4 w-4" /> Create Event
                    </Link>
                </motion.div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="border-none shadow-sm hover:shadow-2xl transition-all h-full bg-white dark:bg-secondary-900 rounded-3xl overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-80 group-hover:w-1.5 transition-all" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">Total Families</CardTitle>
                            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl ring-1 ring-primary-500/10 group-hover:rotate-12 transition-transform">
                                <Users className="h-4 w-4 text-primary-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter tabular-nums">{totalFamilies}</div>
                            <div className="flex items-center mt-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30">
                                    <TrendingUp className="w-3 h-3 mr-1" /> ACTIVE REACH
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="border-none shadow-sm hover:shadow-2xl transition-all h-full bg-white dark:bg-secondary-900 rounded-3xl overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-80 group-hover:w-1.5 transition-all" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">New Messages</CardTitle>
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl ring-1 ring-blue-500/10 group-hover:rotate-12 transition-transform">
                                <FileText className="h-4 w-4 text-blue-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter tabular-nums">{pendingRequests.length}</div>
                            <p className="text-[9px] font-black text-secondary-400 mt-2 uppercase tracking-[0.2em]">Awaiting Review</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="border-none shadow-sm hover:shadow-2xl transition-all h-full bg-white dark:bg-secondary-900 rounded-3xl overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-80 group-hover:w-1.5 transition-all" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">Monthly Snap</CardTitle>
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl ring-1 ring-emerald-500/10 group-hover:rotate-12 transition-transform">
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter tabular-nums">₱{stats.monthlyCollected.toLocaleString()}</div>
                            <div className="flex items-center mt-2">
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Community Fund</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="border-none shadow-sm hover:shadow-2xl transition-all h-full bg-white dark:bg-secondary-900 rounded-3xl overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-80 group-hover:w-1.5 transition-all" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">Live Events</CardTitle>
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl ring-1 ring-amber-500/10 group-hover:rotate-12 transition-transform">
                                <Calendar className="h-4 w-4 text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter tabular-nums">{upcomingEvents.length}</div>
                            <p className="text-[9px] font-black text-secondary-400 mt-2 uppercase tracking-widest truncate">Next: {upcomingEvents[0]?.title || 'None'}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Action Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={itemVariants}>
                    <Card className="shadow-lg transition-all bg-white dark:bg-secondary-900 rounded-2xl border-secondary-100 dark:border-secondary-800 overflow-hidden h-full">
                        <CardHeader className="bg-secondary-50/50 dark:bg-secondary-800/30 border-b border-secondary-100 dark:border-secondary-800">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-secondary-900 dark:text-white">
                                <AlertCircle className="w-5 h-5 text-primary-500" />
                                Recent Inbox Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {recentRequests.length === 0 ? (
                                    <div className="text-center py-10 opacity-60 italic font-medium">No recent requests.</div>
                                ) : (
                                    recentRequests.map((req) => (
                                        <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-secondary-50 dark:border-secondary-800 bg-secondary-50/30 dark:bg-white/5 hover:border-primary-200 dark:hover:border-primary-900/30 transition-all group">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm truncate text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors uppercase tracking-tight">{req.message}</h4>
                                                <p className="text-xs font-bold text-secondary-900 dark:text-secondary-200 mt-0.5 opacity-60">From: {req.name}</p>
                                            </div>
                                            <Link href="/admin/feedback" className="ml-4 px-4 py-2 text-xs font-bold rounded-lg bg-secondary-900 text-white hover:bg-black dark:bg-white dark:text-secondary-900 dark:hover:bg-secondary-100 shadow-sm transition-all hover:scale-105 shrink-0">
                                                Review
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-6 pt-6 border-t border-secondary-100 dark:border-secondary-800 text-center">
                                <Link href="/admin/feedback" className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline underline-offset-4">Open All Messages</Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="shadow-lg transition-all bg-white dark:bg-secondary-900 rounded-2xl border-secondary-100 dark:border-secondary-800 overflow-hidden h-full">
                        <CardHeader className="bg-secondary-50/50 dark:bg-secondary-800/30 border-b border-secondary-100 dark:border-secondary-800">
                            <CardTitle className="text-lg font-bold text-secondary-900 dark:text-white">Financial Trends</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center min-h-[280px]">
                            <div className="flex flex-col items-center gap-4 opacity-40">
                                <TrendingUp className="w-16 h-16 text-secondary-300 dark:text-secondary-700" />
                                <p className="text-secondary-900 dark:text-secondary-200 text-sm font-bold uppercase tracking-widest text-center">Visual analytics<br />Loading dashboard module</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

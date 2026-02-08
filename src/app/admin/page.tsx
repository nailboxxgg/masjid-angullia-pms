"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getDonationStats, DonationStats } from "@/lib/donations";
import { getFeedbacksByType, FeedbackData } from "@/lib/feedback";
import { getEvents } from "@/lib/events";
import { countFamilies } from "@/lib/families";
import { Event } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

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

    useEffect(() => {
        const loadDashboardData = async () => {
            const [donationStats, requests, events, familyCount] = await Promise.all([
                getDonationStats(),
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
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-secondary-100 font-heading">Admin Overview</h1>
                    <p className="text-secondary-600 dark:text-secondary-400 mt-1">Welcome back. Here is what&apos;s happening at Masjid Angullia.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/families" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 h-9 px-4 py-2 shadow-sm transition-colors shrink-0">
                        <Users className="mr-2 h-4 w-4 text-secondary-500" /> Register Family
                    </Link>
                    <Link href="/admin/feed" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary-600 dark:bg-primary-700 text-white hover:bg-primary-700 dark:hover:bg-primary-800 h-9 px-4 py-2 shadow-sm transition-colors shrink-0">
                        <Calendar className="mr-2 h-4 w-4" /> Create Event
                    </Link>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-primary-500 dark:bg-secondary-900 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Families</CardTitle>
                        <Users className="h-4 w-4 text-primary-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">{totalFamilies}</div>
                        <p className="text-xs text-green-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" /> Registered in system
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-secondary-500 dark:bg-secondary-900 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Pending Requests</CardTitle>
                        <FileText className="h-4 w-4 text-secondary-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">{pendingRequests.length}</div>
                        <p className="text-xs text-secondary-500">Requires attention</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-accent-500 dark:bg-secondary-900 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Month&apos;s Donations</CardTitle>
                        <DollarSign className="h-4 w-4 text-accent-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">₱{stats.monthlyCollected.toLocaleString()}</div>
                        <p className="text-xs text-green-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" /> +0% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-accent-500 dark:bg-secondary-900 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Upcoming Events</CardTitle>
                        <Calendar className="h-4 w-4 text-secondary-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">{upcomingEvents.length}</div>
                        <p className="text-xs text-secondary-500">Next: {upcomingEvents[0]?.title || 'None'}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Action Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Recent Requests List */}
                <Card className="col-span-1 dark:bg-secondary-900 shadow-md transition-colors duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-secondary-900 dark:text-secondary-100">
                            <AlertCircle className="w-5 h-5 text-secondary-500" />
                            Recent Pending Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentRequests.length === 0 ? (
                                <p className="text-sm text-secondary-500 italic">No pending requests.</p>
                            ) : (
                                recentRequests.map((req) => (
                                    <div key={req.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg border border-secondary-100 dark:border-secondary-700 transition-colors">
                                        <div>
                                            <h4 className="font-medium text-secondary-900 dark:text-secondary-100 text-sm line-clamp-1">{req.message}</h4>
                                            <p className="text-xs text-secondary-500">Submitted by: {req.name}</p>
                                        </div>
                                        <Link href="/admin/requests" className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-300 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                                            Review
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-secondary-100 dark:border-secondary-800 text-center">
                            <Link href="/admin/requests" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View All Requests</Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats or Activity */}
                <Card className="col-span-1 dark:bg-secondary-900 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg text-secondary-900 dark:text-secondary-100">Financial Snapshot</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[240px] bg-secondary-50 dark:bg-secondary-800 rounded-lg border border-dashed border-secondary-200 dark:border-secondary-700">
                        <p className="text-secondary-400 text-sm italic">Chart visualization coming soon</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

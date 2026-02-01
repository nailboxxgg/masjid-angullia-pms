
"use client";

import { useState, useEffect } from "react";
import { Donation } from "@/lib/types";
import { getDonations, getDonationStats, DonationStats } from "@/lib/donations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Download, Search, Filter, TrendingUp, PieChart, Calendar } from "lucide-react";

import ImportModal from "./ImportModal";
import { Upload } from "lucide-react";

export default function FinancesPage() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [stats, setStats] = useState<DonationStats>({
        totalCollected: 0,
        monthlyCollected: 0,
        breakdown: {},
        recentDonations: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        // Stats function now returns both aggregated data and recent list
        const statsData = await getDonationStats();
        // Fallback or separate fetch if we need comprehensive list for table pagination later
        // For now, using what's available
        setStats(statsData);

        // If we need a full list separate from the stats sample:
        const fullList = await getDonations();
        setDonations(fullList);

        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-secondary-900 font-heading">Financial Overview</h1>
                    <p className="text-sm text-secondary-500">Track incoming donations and funds.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Upload className="w-4 h-4" /> Import Excel
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Total Collections</CardTitle>
                        <DollarSign className="w-4 h-4 text-primary-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-heading">₱{stats.totalCollected.toLocaleString()}</div>
                        <p className="text-xs text-secondary-400 mt-1">Lifetime contributions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">This Month</CardTitle>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-heading">₱{stats.monthlyCollected.toLocaleString()}</div>
                        <p className="text-xs text-secondary-400 mt-1">
                            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Top Category</CardTitle>
                        <PieChart className="w-4 h-4 text-secondary-400" />
                    </CardHeader>
                    <CardContent>
                        {/* Simple logic to find max category */}
                        <div className="text-lg font-bold font-heading truncate">
                            {Object.entries(stats.breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"}
                        </div>
                        <p className="text-xs text-secondary-400 mt-1">Most supported fund</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Donations</CardTitle>
                    <CardDescription>Latest contributions from the community.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filters (Mock) */}
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
                            <input
                                type="search"
                                placeholder="Search donor..."
                                className="w-full pl-9 h-9 rounded-md border border-secondary-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-3 h-9 border border-secondary-300 rounded-md text-sm text-secondary-600 hover:bg-secondary-50">
                            <Filter className="w-3 h-3" /> Filter
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary-50 text-secondary-500 font-medium">
                                <tr className="border-b border-secondary-200">
                                    <th className="px-4 py-3">Donor</th>
                                    <th className="px-4 py-3">Type/Fund</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-secondary-500">Loading transactions...</td>
                                    </tr>
                                ) : donations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-secondary-500">No donations found.</td>
                                    </tr>
                                ) : (
                                    donations.map((donation) => (
                                        <tr key={donation.id} className="hover:bg-secondary-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-secondary-900">
                                                    {donation.isAnonymous ? "Anonymous" : donation.donorName}
                                                </div>
                                                <div className="text-xs text-secondary-400">
                                                    {donation.email || (donation.isAnonymous ? "Hidden" : "No email")}
                                                </div>
                                                {donation.message && (
                                                    <div className="text-[10px] text-primary-600 mt-1 italic line-clamp-1">
                                                        "{donation.message}"
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                    {donation.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-secondary-500 whitespace-nowrap">
                                                {formatDate(donation.date)}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-secondary-900">
                                                ₱{donation.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                    Verified
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <ImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
}

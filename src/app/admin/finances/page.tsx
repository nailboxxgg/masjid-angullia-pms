
"use client";

import { useState, useEffect } from "react";
import { Donation } from "@/lib/types";
import { deleteDonation, getDonations, getDonationStats, DonationStats } from "@/lib/donations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { DollarSign, Download, Search, Filter, TrendingUp, PieChart, Calendar, Trash2 } from "lucide-react";

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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [donationToDelete, setDonationToDelete] = useState<string | null>(null);

    const [typeFilter, setTypeFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const handleDelete = (id: string) => {
        setDonationToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (donationToDelete) {
            const success = await deleteDonation(donationToDelete);
            if (success) {
                loadData();
            } else {
                alert("Failed to delete donation. Please try again.");
            }
            setIsDeleteModalOpen(false);
            setDonationToDelete(null);
        }
    };

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
        return new Date(timestamp).toLocaleDateString('en-PH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredDonations = donations.filter(donation => {
        const matchesSearch = (donation.donorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (donation.email || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || donation.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-secondary-900 dark:text-secondary-100 font-heading">Financial Overview</h1>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">Track incoming donations and funds.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-md text-sm font-medium hover:bg-primary-700 dark:hover:bg-primary-800 transition-colors shadow-sm"
                    >
                        <Upload className="w-4 h-4" /> Import Excel
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-md text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="transition-colors duration-300 bg-secondary-900 border-secondary-800 dark:bg-white dark:border-secondary-200 !dark:bg-white !dark:border-secondary-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-400 dark:text-secondary-500">Total Collections</CardTitle>
                        <DollarSign className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-heading text-white dark:text-secondary-900">₱{stats.totalCollected.toLocaleString()}</div>
                        <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">Lifetime contributions</p>
                    </CardContent>
                </Card>

                <Card className="transition-colors duration-300 bg-secondary-900 border-secondary-800 dark:bg-white dark:border-secondary-200 !dark:bg-white !dark:border-secondary-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 ">
                        <CardTitle className="text-sm font-medium text-secondary-400 dark:text-secondary-500">This Month</CardTitle>
                        <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-heading text-white dark:text-secondary-900">₱{stats.monthlyCollected.toLocaleString()}</div>
                        <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </p>
                    </CardContent>
                </Card>

                <Card className="transition-colors duration-300 bg-secondary-900 border-secondary-800 dark:bg-white dark:border-secondary-200 !dark:bg-white !dark:border-secondary-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-400 dark:text-secondary-500">Top Category</CardTitle>
                        <PieChart className="w-4 h-4 text-secondary-400 dark:text-secondary-500" />
                    </CardHeader>
                    <CardContent>
                        {/* Simple logic to find max category */}
                        <div className="text-lg font-bold font-heading truncate text-white dark:text-secondary-900">
                            {Object.entries(stats.breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"}
                        </div>
                        <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">Most supported fund</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions Table */}
            <Card className="transition-colors duration-300 bg-secondary-900 border-secondary-800 dark:bg-white dark:border-secondary-200 !dark:bg-white !dark:border-secondary-200">
                <CardHeader>
                    <CardTitle className="text-lg text-white dark:text-secondary-900">Recent Donations</CardTitle>
                    <CardDescription className="text-secondary-400 dark:text-secondary-500">Latest contributions from the community.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex gap-2 mb-4 relative z-20">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400 dark:text-secondary-500" />
                            <input
                                type="search"
                                placeholder="Search donor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 h-9 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors bg-secondary-800 border-secondary-700 text-secondary-100 placeholder:text-secondary-500 dark:bg-secondary-50 dark:border-secondary-200 dark:text-secondary-900 dark:placeholder:text-secondary-400"
                            />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-3 h-9 border rounded-md text-sm transition-colors ${typeFilter !== 'All'
                                    ? 'bg-primary-900/50 border-primary-800 text-primary-400 dark:bg-primary-50 dark:border-primary-200 dark:text-primary-700'
                                    : 'border-secondary-700 text-secondary-400 hover:bg-white/5 dark:border-secondary-200 dark:text-secondary-600 dark:hover:bg-secondary-50'
                                    }`}
                            >
                                <Filter className="w-3 h-3" /> Filter
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-secondary-900 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-800 p-4 space-y-4 z-50 transition-colors">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">Donation Type</label>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="w-full text-sm border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 rounded-md focus:ring-primary-500 focus:border-primary-500 text-secondary-800 dark:text-secondary-100 transition-colors"
                                        >
                                            <option value="All">All Types</option>
                                            <option value="General">General</option>
                                            <option value="Zakat">Zakat</option>
                                            <option value="Sadaqah">Sadaqah</option>
                                            <option value="Projects">Projects</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    {typeFilter !== 'All' && (
                                        <button
                                            onClick={() => setTypeFilter('All')}
                                            className="w-full text-xs text-red-600 hover:text-red-700 text-center mt-2 underline"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="font-medium border-b transition-colors bg-secondary-800 text-secondary-200 border-secondary-700 dark:bg-secondary-50 dark:text-secondary-700 dark:border-secondary-200 !dark:bg-secondary-50 !dark:text-secondary-700 !dark:border-secondary-200">
                                <tr>
                                    <th className="px-4 py-3">Donor</th>
                                    <th className="px-4 py-3">Type/Fund</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y transition-colors divide-secondary-800 dark:divide-secondary-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-secondary-500">Loading transactions...</td>
                                    </tr>
                                ) : filteredDonations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-secondary-500">No donations found matching your filters.</td>
                                    </tr>
                                ) : (
                                    filteredDonations.map((donation) => (
                                        <tr key={donation.id} className="transition-colors hover:bg-white/5 dark:hover:bg-secondary-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-white dark:text-secondary-900">
                                                    {donation.isAnonymous ? "Anonymous" : donation.donorName}
                                                </div>
                                                <div className="text-xs text-secondary-400 dark:text-secondary-500">
                                                    {donation.email || (donation.isAnonymous ? "Hidden" : "No email")}
                                                </div>
                                                {donation.message && (
                                                    <div className="text-[10px] text-primary-600 dark:text-primary-400 mt-1 italic line-clamp-1">
                                                        "{donation.message}"
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 transition-colors">
                                                    {donation.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-secondary-500 dark:text-secondary-400 whitespace-nowrap">
                                                {formatDate(donation.date)}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-white dark:text-secondary-900">
                                                ₱{donation.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800 transition-colors">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400"></div>
                                                    Verified
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleDelete(donation.id)}
                                                    className="font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-md transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Deletion"
            >
                <div className="space-y-4 py-2 bg-white dark:bg-secondary-900 transition-colors">
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Are you sure you want to delete this donation? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 transition-colors">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 rounded-md transition-colors shadow-sm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

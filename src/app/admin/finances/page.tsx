
"use client";

import { useState, useEffect } from "react";
import { Donation } from "@/lib/types";
import { deleteDonation, getDonations, getDonationStats, DonationStats } from "@/lib/donations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { DollarSign, Download, Search, Filter, TrendingUp, PieChart, Calendar, Trash2 } from "lucide-react";

import ImportModal from "./ImportModal";
import { Upload } from "lucide-react";

import { motion } from "framer-motion";
import { useAdmin } from "@/contexts/AdminContext";

export default function FinancesPage() {
    const { role } = useAdmin();
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
            y: -8,
            scale: 1.02,
            transition: { duration: 0.3 }
        }
    };

    const handleDelete = (id: string) => {
        if (role !== 'admin') return;
        setDonationToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (donationToDelete && role === 'admin') {
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
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <motion.div variants={itemVariants}>
                    <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white">Donations & Finances</h1>
                    <p className="text-secondary-900 dark:text-secondary-200 mt-1 font-medium italic text-balance">Comprehensive tracking of masjid funds and community contributions.</p>
                </motion.div>
                <motion.div variants={itemVariants} className="flex gap-2">
                    {role === 'admin' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsImportOpen(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-xl text-sm font-bold hover:bg-primary-700 dark:hover:bg-primary-800 shadow-lg shadow-primary-500/20 transition-all shrink-0"
                        >
                            <Upload className="w-4 h-4" /> Import File
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl text-sm font-black uppercase tracking-widest text-secondary-900 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-secondary-700 shadow-sm transition-all"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </motion.button>
                </motion.div>
            </div>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-3 gap-6">
                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm hover:shadow-xl transition-all rounded-2xl overflow-hidden border-l-4 border-l-primary-500 h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-secondary-900 dark:text-secondary-200 uppercase tracking-wider">Total Collections</CardTitle>
                            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                                <DollarSign className="w-4 h-4 text-primary-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">₱{stats.totalCollected.toLocaleString()}</div>
                            <p className="text-xs font-bold text-secondary-900 dark:text-secondary-200 mt-1 opacity-60 uppercase tracking-widest">Lifetime contributions</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm hover:shadow-xl transition-all rounded-2xl overflow-hidden border-l-4 border-l-green-500 h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 ">
                            <CardTitle className="text-sm font-bold text-secondary-900 dark:text-secondary-200 uppercase tracking-wider">This Month</CardTitle>
                            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">₱{stats.monthlyCollected.toLocaleString()}</div>
                            <p className="text-xs font-bold text-green-600 dark:text-green-400 mt-1 uppercase tracking-widest">
                                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm hover:shadow-xl transition-all rounded-2xl overflow-hidden border-l-4 border-l-amber-500 h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-secondary-900 dark:text-secondary-200 uppercase tracking-wider">Top Category</CardTitle>
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                <PieChart className="w-4 h-4 text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold truncate text-secondary-900 dark:text-secondary-100">
                                {Object.entries(stats.breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"}
                            </div>
                            <p className="text-xs font-bold text-secondary-900 dark:text-secondary-200 mt-1 opacity-60 uppercase tracking-widest">Most supported fund</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Recent Transactions Table */}
            <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-secondary-900 dark:text-secondary-100">Recent Donations</CardTitle>
                    <CardDescription className="text-secondary-900 dark:text-secondary-200 font-medium">Latest contributions from the community.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex gap-2 mb-4 relative z-20">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-900 dark:text-secondary-200" />
                            <input
                                type="search"
                                placeholder="Search donor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 h-9 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50 border-secondary-200 text-secondary-900 placeholder:text-secondary-500 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-100 dark:placeholder:text-secondary-400"
                            />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-3 h-9 border rounded-md text-sm ${typeFilter !== 'All'
                                    ? 'bg-primary-900/50 border-primary-800 text-primary-400 dark:bg-primary-50 dark:border-primary-200 dark:text-primary-700'
                                    : 'border-secondary-700 text-secondary-900 font-semibold hover:bg-white/5 dark:border-secondary-200 dark:text-secondary-100 dark:hover:bg-secondary-50'
                                    }`}
                            >
                                <Filter className="w-3 h-3" /> Filter
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-secondary-900 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-800 p-4 space-y-4 z-50">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-secondary-900 dark:text-secondary-200 uppercase">Donation Type</label>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="w-full text-xs bg-secondary-50 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 rounded-md p-2 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        >
                                            <option value="All">All Types</option>
                                            <option value="Zakat">Zakat</option>
                                            <option value="Sadaqah">Sadaqah</option>
                                            <option value="Waqf">Waqf</option>
                                            <option value="General">General</option>
                                        </select>
                                    </div>
                                    {typeFilter !== 'All' && (
                                        <button
                                            onClick={() => setTypeFilter('All')}
                                            className="w-full text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-center mt-2 underline"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-secondary-200 border-y border-secondary-200 dark:border-secondary-700">
                                <tr>
                                    <th className="px-4 py-3 text-secondary-900 dark:text-secondary-200 font-semibold">Date</th>
                                    <th className="px-4 py-3 text-secondary-900 dark:text-secondary-200 font-semibold">Donor</th>
                                    <th className="px-4 py-3 text-secondary-900 dark:text-secondary-200 font-semibold">Type</th>
                                    <th className="px-4 py-3 text-secondary-900 dark:text-secondary-200 font-semibold text-right">Amount</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    {role === 'admin' && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800 text-secondary-900 dark:text-secondary-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-secondary-900 dark:text-secondary-200 font-medium">No donations found matching your filters.</td>
                                    </tr>
                                ) : (
                                    filteredDonations.map((donation, index) => (
                                        <motion.tr
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            key={donation.id}
                                            className="hover:bg-secondary-50 dark:hover:bg-white/5 transition-all group relative cursor-default"
                                        >
                                            <td className="px-4 py-4 text-secondary-900 dark:text-secondary-200 whitespace-nowrap font-bold relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                {formatDate(donation.date)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-secondary-900 dark:text-secondary-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    {donation.isAnonymous ? "Anonymous" : donation.donorName}
                                                </div>
                                                <div className="text-xs font-medium text-secondary-900 dark:text-secondary-200">
                                                    {donation.email || (donation.isAnonymous ? "Hidden" : "No email")}
                                                </div>
                                                {donation.message && (
                                                    <div className="text-[10px] text-primary-600 dark:text-primary-400 mt-1 italic line-clamp-1 border-l-2 border-primary-100 dark:border-primary-900/30 pl-2">
                                                        "{donation.message}"
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 shadow-sm">
                                                    {donation.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 font-black text-secondary-900 dark:text-secondary-100 text-right">
                                                ₱{donation.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                    Verified
                                                </span>
                                            </td>
                                            {role === 'admin' && (
                                                <td className="px-4 py-4 text-right">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, color: "#e11d48" }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDelete(donation.id)}
                                                        className="font-medium text-secondary-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2 rounded-xl transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </motion.button>
                                                </td>
                                            )}
                                        </motion.tr>
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
                <div className="space-y-4 py-2 bg-white dark:bg-secondary-900">
                    <p className="text-sm font-semibold text-secondary-900 dark:text-secondary-200">
                        Are you sure you want to delete this donation? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-sm font-bold text-secondary-900 dark:text-white hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 rounded-md shadow-sm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
}

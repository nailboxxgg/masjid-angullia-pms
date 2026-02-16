
"use client";

import { useState, useEffect } from "react";
import { Donation } from "@/lib/types";
import { deleteDonation, updateDonationStatus, getDonations, getDonationStats, DonationStats } from "@/lib/donations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { DollarSign, Download, Search, Filter, TrendingUp, PieChart, Calendar, Trash2, Mail, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

    const handleStatusUpdate = async (id: string, status: Donation['status']) => {
        if (role !== 'admin') return;
        const success = await updateDonationStatus(id, status);
        if (success) {
            // Optimistic update or reload
            setDonations(prev => prev.map(d => d.id === id ? { ...d, status } : d));
            loadData();
        } else {
            alert("Failed to update status.");
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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <motion.div variants={itemVariants}>
                    <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white uppercase tracking-tighter">Donations & Finances</h1>
                    <p className="text-secondary-900 dark:text-secondary-200 mt-1 font-medium italic text-balance">Comprehensive tracking of masjid funds and community contributions.</p>
                </motion.div>
                <motion.div variants={itemVariants} className="flex flex-wrap gap-2 w-full lg:w-auto">
                    {role === 'admin' && (
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsImportOpen(true)}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 dark:bg-primary-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 dark:hover:bg-primary-800 shadow-xl shadow-primary-500/20 transition-all shrink-0"
                        >
                            <Upload className="w-4 h-4" /> Import Data
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary-900 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-secondary-800 shadow-sm transition-all"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </motion.button>
                </motion.div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm hover:shadow-2xl transition-all rounded-2xl overflow-hidden border-l-4 border-l-primary-500 h-full group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-secondary-500 dark:text-secondary-400 uppercase tracking-widest">Total Collections</CardTitle>
                            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-xl ring-1 ring-primary-100 dark:ring-primary-800/50 group-hover:rotate-12 transition-transform">
                                <DollarSign className="w-4 h-4 text-primary-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-secondary-900 dark:text-secondary-100 tabular-nums">₱{stats.totalCollected.toLocaleString()}</div>
                            <p className="text-[10px] font-black text-secondary-400 mt-1 uppercase tracking-widest">Lifetime contributions</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm hover:shadow-2xl transition-all rounded-2xl overflow-hidden border-l-4 border-l-emerald-500 h-full group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-secondary-500 dark:text-secondary-400 uppercase tracking-widest">Maison Monthly</CardTitle>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl ring-1 ring-emerald-100 dark:ring-emerald-800/50 group-hover:rotate-12 transition-transform">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-secondary-900 dark:text-secondary-100 tabular-nums">₱{stats.monthlyCollected.toLocaleString()}</div>
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-widest font-bold">
                                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} whileHover="hover" className="sm:col-span-2 md:col-span-1">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm hover:shadow-2xl transition-all rounded-2xl overflow-hidden border-l-4 border-l-amber-500 h-full group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-secondary-500 dark:text-secondary-400 uppercase tracking-widest">Top Category</CardTitle>
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl ring-1 ring-amber-100 dark:ring-amber-800/50 group-hover:rotate-12 transition-transform">
                                <PieChart className="w-4 h-4 text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-black truncate text-secondary-900 dark:text-secondary-100 uppercase tracking-tight">
                                {Object.entries(stats.breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"}
                            </div>
                            <p className="text-[10px] font-black text-secondary-400 mt-1 uppercase tracking-widest">Most supported fund</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Financial Ledger Section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-secondary-900 p-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                            <Calendar className="w-4 h-4 text-primary-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-tight">Financial Ledger</h3>
                            <p className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest">Live Transaction History</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                            <input
                                type="search"
                                placeholder="Search donors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 h-10 rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all shadow-inner"
                            />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={cn(
                                    "flex items-center gap-2 px-4 h-10 border rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    typeFilter !== 'All'
                                        ? "bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-500/20"
                                        : "bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                                )}
                            >
                                <Filter className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Filter</span>
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-800 p-5 space-y-4 z-50">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">Donation Type</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {['All', 'Zakat', 'Sadaqah', 'Waqf', 'General'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => {
                                                        setTypeFilter(type);
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all",
                                                        typeFilter === type
                                                            ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                                            : "text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                                                    )}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {typeFilter !== 'All' && (
                                        <button
                                            onClick={() => {
                                                setTypeFilter('All');
                                                setIsFilterOpen(false);
                                            }}
                                            className="w-full py-2 text-[10px] font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg uppercase tracking-widest border border-rose-100 dark:border-rose-900/30 transition-all"
                                        >
                                            Reset Filter
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Display - Responsive Card/Table Wrapper */}
                <div className="space-y-4">
                    {/* Mobile/Tablet View: Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
                        {isLoading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-secondary-900 rounded-2xl p-5 border border-secondary-100 dark:border-secondary-800 animate-pulse space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-secondary-100 dark:bg-secondary-800 rounded"></div>
                                            <div className="h-3 w-24 bg-secondary-100 dark:bg-secondary-800 rounded"></div>
                                        </div>
                                        <div className="h-4 w-16 bg-secondary-100 dark:bg-secondary-800 rounded-full"></div>
                                    </div>
                                    <div className="pt-2 border-t border-secondary-50 dark:border-secondary-800 flex justify-between">
                                        <div className="h-4 w-20 bg-secondary-100 dark:bg-secondary-800 rounded mt-2"></div>
                                        <div className="h-6 w-24 bg-secondary-100 dark:bg-secondary-800 rounded mt-1"></div>
                                    </div>
                                </div>
                            ))
                        ) : filteredDonations.length === 0 ? (
                            <div className="sm:col-span-2 bg-white dark:bg-secondary-900 rounded-3xl border border-secondary-200 dark:border-secondary-800 p-16 text-center">
                                <Search className="w-12 h-12 text-secondary-200 dark:text-secondary-800 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">No donations found</h3>
                                <p className="text-secondary-500 text-sm mt-1 font-medium italic">Try adjusting your filters</p>
                            </div>
                        ) : (
                            filteredDonations.map((donation, index) => (
                                <motion.div
                                    key={donation.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -4 }}
                                    className="bg-white dark:bg-secondary-900 rounded-2xl p-5 border border-secondary-100 dark:border-secondary-800 shadow-sm relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <p className="text-base font-black text-secondary-900 dark:text-white uppercase tracking-tight leading-tight">
                                                {donation.isAnonymous ? "Anonymous Donor" : donation.donorName}
                                            </p>
                                            <p className="text-[10px] font-bold text-secondary-400 italic flex items-center gap-1.5">
                                                <Mail className="w-3 h-3" />
                                                {donation.email || (donation.isAnonymous ? "Identity Hidden" : "No contact info")}
                                            </p>
                                        </div>
                                        {donation.status === 'completed' ? (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Verified
                                            </span>
                                        ) : donation.status === 'failed' ? (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 flex items-center gap-1">
                                                <XCircle className="w-3 h-3" /> Failed
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Pending
                                                </span>
                                                {role === 'admin' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(donation.id, 'completed')}
                                                        className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors shadow-sm"
                                                        title="Approve Donation"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {donation.message && (
                                        <div className="mb-4 p-3 bg-secondary-50/50 dark:bg-secondary-950/50 rounded-xl text-[11px] text-secondary-600 dark:text-secondary-400 italic border-l-2 border-primary-500">
                                            "{donation.message}"
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-secondary-50 dark:border-secondary-800">
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Transaction Date</p>
                                            <p className="text-xs font-bold text-secondary-700 dark:text-secondary-300">{formatDate(donation.date)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[9px] font-black text-primary-500 uppercase tracking-widest mb-0.5">{donation.type}</span>
                                            <span className="text-xl font-black text-secondary-900 dark:text-white tabular-nums">₱{donation.amount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {role === 'admin' && (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={() => handleDelete(donation.id)}
                                                className="flex items-center gap-1.5 text-rose-600 font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Remove Record
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* PC View: Table */}
                    <Card className="hidden lg:block border-none shadow-xl overflow-hidden bg-white dark:bg-secondary-900 rounded-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-secondary-50/50 dark:bg-secondary-950 border-b border-secondary-100 dark:border-secondary-800 font-bold uppercase tracking-widest text-[10px] text-secondary-500">
                                        <th className="px-6 py-4">Transaction / Date</th>
                                        <th className="px-6 py-4">Donor Information</th>
                                        <th className="px-6 py-4">Allocation</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        {role === 'admin' && <th className="px-6 py-4 text-right">Settings</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-4"><div className="h-4 w-32 bg-secondary-100 dark:bg-secondary-800 rounded"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 w-48 bg-secondary-100 dark:bg-secondary-800 rounded"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 w-20 bg-secondary-100 dark:bg-secondary-800 rounded-full"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 w-24 bg-secondary-100 dark:bg-secondary-800 rounded ml-auto"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 w-20 bg-secondary-100 dark:bg-secondary-800 rounded-full mx-auto"></div></td>
                                            </tr>
                                        ))
                                    ) : filteredDonations.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-24 text-center">
                                                <div className="max-w-xs mx-auto opacity-30">
                                                    <DollarSign className="w-12 h-12 mx-auto mb-4" />
                                                    <p className="font-black uppercase tracking-widest text-xs">No records matching search</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDonations.map((donation, index) => (
                                            <tr key={donation.id} className="hover:bg-secondary-50/50 dark:hover:bg-white/5 transition-all group cursor-default">
                                                <td className="px-6 py-5 relative whitespace-nowrap">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-secondary-900 dark:text-white uppercase tracking-tight">{formatDate(donation.date)}</p>
                                                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">ID: {donation.id?.slice(0, 8)}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors uppercase tracking-tight">
                                                            {donation.isAnonymous ? "Anonymous Contributor" : donation.donorName}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-secondary-500">
                                                            <Mail className="w-3 h-3 text-secondary-400" />
                                                            {donation.email || "No contact info"}
                                                        </div>
                                                        {donation.message && (
                                                            <div className="text-[10px] text-primary-600 dark:text-primary-400 italic line-clamp-1 border-l-2 border-primary-100 dark:border-primary-900/30 pl-2 mt-1.5 bg-primary-50/20 dark:bg-primary-900/10 py-0.5 rounded-r">
                                                                "{donation.message}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 shadow-sm">
                                                        {donation.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-secondary-900 dark:text-white text-base tabular-nums">
                                                    ₱{donation.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        {donation.status === 'completed' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                                Verified
                                                            </span>
                                                        ) : donation.status === 'failed' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800/50 shadow-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                                Failed
                                                            </span>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 shadow-sm">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                                    Pending
                                                                </span>
                                                                {role === 'admin' && (
                                                                    <button
                                                                        onClick={() => handleStatusUpdate(donation.id, 'completed')}
                                                                        className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors"
                                                                        title="Verify Donation"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                {role === 'admin' && (
                                                    <td className="px-6 py-5 text-right">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, y: -2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleDelete(donation.id)}
                                                            className="text-secondary-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2.5 rounded-xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                                                            title="Delete Entry"
                                                        >
                                                            <Trash2 className="w-4.5 h-4.5" />
                                                        </motion.button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

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

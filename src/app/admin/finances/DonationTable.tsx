"use client";

import { Donation } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, Trash2, Search } from "lucide-react";
import { motion } from "framer-motion";

interface DonationTableProps {
    donations: Donation[];
    isLoading: boolean;
    role: string | null;
    onStatusUpdate: (id: string, status: Donation['status']) => void;
    onDelete: (id: string) => void;
}

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-PH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function DonationTable({ donations, isLoading, role: _role, onStatusUpdate, onDelete }: DonationTableProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {/* Loading skeletons... */}
                {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-secondary-900 rounded-2xl p-5 border border-secondary-100 dark:border-secondary-800 animate-pulse space-y-4">
                        <div className="h-4 w-32 bg-secondary-100 dark:bg-secondary-800 rounded"></div>
                        <div className="h-3 w-24 bg-secondary-100 dark:bg-secondary-800 rounded"></div>
                    </div>
                ))}
            </div>
        )
    }

    if (donations.length === 0) {
        return (
            <div className="col-span-12 bg-white dark:bg-secondary-900 rounded-3xl border border-secondary-200 dark:border-secondary-800 p-16 text-center shadow-sm">
                <Search className="w-12 h-12 text-secondary-200 dark:text-secondary-800 mx-auto mb-4" />
                <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">No donations found</h3>
                <p className="text-secondary-500 text-sm mt-1 font-medium italic">Try adjusting your filters</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Mobile/Tablet View: Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
                {donations.map((donation) => (
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
                                    {donation.isAnonymous ? "Identity Hidden" : "Public Record"}
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
                                    <button
                                        onClick={() => onStatusUpdate(donation.id, 'completed')}
                                        className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors shadow-sm"
                                        title="Approve Donation"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {donation.message && (
                            <div className="mb-4 p-3 bg-secondary-50/50 dark:bg-secondary-950/50 rounded-xl text-[11px] text-secondary-600 dark:text-secondary-400 italic border-l-2 border-primary-500">
                                &ldquo;{donation.message}&rdquo;
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

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => onDelete(donation.id)}
                                className="flex items-center gap-1.5 text-rose-600 font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove Record
                            </button>
                        </div>
                    </motion.div>
                ))}
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
                                <th className="px-6 py-4 text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
                            {donations.map((donation) => (
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
                                                Verified Donor
                                            </div>
                                            {donation.message && (
                                                <div className="text-[10px] text-primary-600 dark:text-primary-400 italic line-clamp-1 border-l-2 border-primary-100 dark:border-primary-900/30 pl-2 mt-1.5 bg-primary-50/20 dark:bg-primary-900/10 py-0.5 rounded-r">
                                                    &ldquo;{donation.message}&rdquo;
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
                                                    <button
                                                        onClick={() => onStatusUpdate(donation.id, 'completed')}
                                                        className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors"
                                                        title="Verify Donation"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <motion.button
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => onDelete(donation.id)}
                                            className="text-secondary-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2.5 rounded-xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                                            title="Delete Entry"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </motion.button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

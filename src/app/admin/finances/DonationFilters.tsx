"use client";

import { useState } from "react";
import { Search, Filter, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DonationFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    typeFilter: string;
    setTypeFilter: (type: string) => void;
}

export default function DonationFilters({ searchTerm, setSearchTerm, typeFilter, setTypeFilter }: DonationFiltersProps) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-secondary-900 p-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-tight">Financial Ledger</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest">Live Transaction History</p>
                        <button className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline" onClick={() => window.open('/donations', '_blank')}>
                            Donate Now
                        </button>
                    </div>
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
                                    {['All', 'Community Welfare', 'General Donation', 'Construction', 'Education', 'General'].map((type) => (
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
    );
}

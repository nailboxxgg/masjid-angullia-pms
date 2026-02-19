"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PieChart } from "lucide-react";
import { DonationStats } from "@/lib/donations";
import { motion } from "framer-motion";

interface StatsOverviewProps {
    stats: DonationStats;
}

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    hover: { y: -8, scale: 1.02, transition: { duration: 0.3 } }
};

export default function StatsOverview({ stats }: StatsOverviewProps) {
    return (
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
    );
}

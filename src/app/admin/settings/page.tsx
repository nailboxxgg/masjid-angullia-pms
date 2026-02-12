"use client";

import { useState } from "react";
import { User, Bell, Lock, Save, PlusCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(false);

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

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            alert("Settings saved successfully!");
        }, 1000);
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-10"
        >
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white uppercase tracking-tighter">Portal Settings</h1>
                <p className="text-secondary-900 dark:text-secondary-200 mt-1 font-medium italic">Manage your account preferences and application security configurations.</p>
            </motion.div>

            <form onSubmit={handleSave} className="grid text-left gap-6 lg:grid-cols-2">
                {/* Profile Settings */}
                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm transition-shadow hover:shadow-xl rounded-2xl overflow-hidden h-full">
                        <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4 bg-secondary-50/30 dark:bg-secondary-800/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl dark:bg-primary-900/20 dark:text-primary-400 ring-1 ring-primary-100 dark:ring-primary-800/50">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-secondary-900 dark:text-white uppercase tracking-tight">Profile Information</CardTitle>
                                    <CardDescription className="text-secondary-500 font-medium text-xs mt-0.5">Update your personal identification details.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-secondary-500 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    defaultValue="Admin User"
                                    className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-secondary-500 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    defaultValue="admin@masjidangullia.com"
                                    className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Security Settings */}
                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm transition-shadow hover:shadow-xl rounded-2xl overflow-hidden h-full">
                        <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4 bg-secondary-50/30 dark:bg-secondary-800/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl dark:bg-amber-900/20 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-800/50">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-secondary-900 dark:text-white uppercase tracking-tight">Security & Access</CardTitle>
                                    <CardDescription className="text-secondary-500 font-medium text-xs mt-0.5">Manage your authentication credentials.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-secondary-500 ml-1">Current Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-secondary-500 ml-1">New Password</label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to keep current"
                                    className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all placeholder:font-medium placeholder:text-secondary-400"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Admin Access Management */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4 bg-secondary-50/30 dark:bg-secondary-800/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl dark:bg-purple-900/20 dark:text-purple-400 ring-1 ring-purple-100 dark:ring-purple-800/50">
                                    <PlusCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-secondary-900 dark:text-white uppercase tracking-tight">Admin Management</CardTitle>
                                    <CardDescription className="text-secondary-500 font-medium text-xs mt-0.5">Invite and authorize new portal administrators.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="p-4 rounded-xl text-sm bg-blue-50/50 text-blue-700 border border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/30 flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                <p className="font-semibold italic"><strong>Security Note:</strong> Adding a new administrator grants them full access to manage families, finances, and portal configurations. Ensure proper vetting before authorization.</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-secondary-500 ml-1">New Admin Email</label>
                                    <input
                                        type="email"
                                        placeholder="new.admin@masjid.com"
                                        className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all placeholder:font-medium placeholder:text-secondary-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-secondary-500 ml-1">Invitation Role</label>
                                    <select className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all">
                                        <option>Super Admin</option>
                                        <option>Finance Manager</option>
                                        <option>Staff Coordinator</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    className="px-6 py-2.5 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black dark:hover:bg-secondary-100 transition-all shadow-lg"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert("In a real implementation, this would trigger a secure invitation workflow.");
                                    }}
                                >
                                    Generate Invitation
                                </motion.button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Notifications */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4 bg-secondary-50/30 dark:bg-secondary-800/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl dark:bg-yellow-900/20 dark:text-yellow-400 ring-1 ring-yellow-100 dark:ring-yellow-800/50">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-secondary-900 dark:text-white uppercase tracking-tight">System Notifications</CardTitle>
                                    <CardDescription className="text-secondary-500 font-medium text-xs mt-0.5">Configure your real-time alert preferences.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 divide-y divide-secondary-50 dark:divide-secondary-800">
                            <div className="flex items-center justify-between py-4 group">
                                <div>
                                    <p className="font-bold text-secondary-900 dark:text-white transition-colors group-hover:text-primary-600">New Request Alerts</p>
                                    <p className="text-xs font-medium text-secondary-500 italic">Push notifications for every community submission.</p>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-4 group">
                                <div>
                                    <p className="font-bold text-secondary-900 dark:text-white transition-colors group-hover:text-primary-600">Daily Donation Summary</p>
                                    <p className="text-xs font-medium text-secondary-500 italic">Receive a CSV digest of all transactions at midnight.</p>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="lg:col-span-2 flex justify-end pt-4">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-xl text-sm font-black uppercase tracking-widest bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-800 h-12 px-10 shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Synchronizing...
                            </span>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save Preferences
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </form>
        </motion.div>
    );
}

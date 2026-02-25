"use client";

import { useState, useEffect } from "react";
import { User, Bell, ShieldCheck, PlusCircle, Save, Trash2, Mail, Shield, Clock as ClockIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import Modal from "@/components/ui/modal";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { createStaffAccountDirectly, getStaffMembers, revokeStaffAccess, StaffMember } from "@/lib/staff";
import { cn } from "@/lib/utils";


export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [settings, setSettings] = useState({
        newRequestAlerts: true,
        dailyDonationSummary: false
    });
    const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);

    // Staff Management State
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const [invitePassword, setInvitePassword] = useState("");
    const [inviteRole, setInviteRole] = useState<StaffMember['role']>("admin");
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsFetching(true);
            try {
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    setIsFetching(false);
                    return;
                }

                // Fetch Profile & Settings
                const userDoc = await getDoc(doc(db, "families", currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserProfile(data);
                    if (data.preferences) {
                        setSettings({
                            newRequestAlerts: data.preferences.newRequestAlerts ?? true,
                            dailyDonationSummary: data.preferences.dailyDonationSummary ?? false
                        });
                    }
                }

                // Fetch Staff Members
                const staffData = await getStaffMembers();
                setStaffList(staffData);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsFetching(false);
            }
        };

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchData();
            } else {
                setIsFetching(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleEnroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || !inviteName || !invitePassword) {
            alert("Please provide name, email, and password.");
            return;
        }

        if (invitePassword.length < 8) {
            alert("Password must be at least 8 characters.");
            return;
        }

        setIsInviting(true);
        try {
            await createStaffAccountDirectly(inviteEmail, invitePassword, inviteName, inviteRole);
            setInviteEmail("");
            setInviteName("");
            setInvitePassword("");
            alert("Staff account created successfully! They can now log in with the email and password you provided.");

            // Refresh list
            const staffData = await getStaffMembers();
            setStaffList(staffData);
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : "Failed to create staff account.";
            alert(errMsg);
        } finally {
            setIsInviting(false);
        }
    };

    const handleRevoke = async (email: string) => {
        if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return;

        try {
            await revokeStaffAccess(email);
            setStaffList(staffList.filter(s => s.email !== email));
        } catch (error) {
            alert("Failed to revoke access.");
        }
    };

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
        setIsSaveModalOpen(true);
    };

    const confirmSave = async () => {
        setIsLoading(true);
        setIsSaveModalOpen(false);

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                alert("You must be logged in to save settings.");
                return;
            }

            await updateDoc(doc(db, "families", currentUser.uid), {
                preferences: settings,
                updatedAt: new Date().getTime()
            });

            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings. Please try again.");
        } finally {
            setIsLoading(false);
        }
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
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm transition-all hover:shadow-2xl hover:border-primary-200 dark:hover:border-primary-900/50 rounded-2xl overflow-hidden h-full group">
                        <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4 bg-secondary-50/30 dark:bg-secondary-800/20 group-hover:bg-secondary-50/80 dark:group-hover:bg-secondary-800/40 transition-colors">
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
                                    defaultValue={(userProfile?.name as string) || ""}
                                    placeholder={isFetching ? "Loading..." : "Admin User"}
                                    readOnly
                                    className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all px-4 opacity-70 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-secondary-500 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    defaultValue={(userProfile?.email as string) || ""}
                                    placeholder={isFetching ? "Loading..." : "admin@masjidangullia.com"}
                                    readOnly
                                    className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all px-4 opacity-70 cursor-not-allowed"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Security Settings */}
                <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm transition-all hover:shadow-2xl hover:border-primary-200 dark:hover:border-primary-900/50 rounded-2xl overflow-hidden h-full group">
                        <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4 bg-secondary-50/30 dark:bg-secondary-800/20 group-hover:bg-secondary-50/80 dark:group-hover:bg-secondary-800/40 transition-colors">
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
                                    disabled
                                    title="Password change not implemented yet"
                                    className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all px-4 opacity-60 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-secondary-500 ml-1">New Password</label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to keep current"
                                    disabled
                                    title="Password change not implemented yet"
                                    className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all placeholder:font-medium placeholder:text-secondary-400 px-4 opacity-60 cursor-not-allowed"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Admin Access Management */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm transition-all hover:shadow-2xl hover:border-primary-200 dark:hover:border-primary-900/50 rounded-2xl overflow-hidden group">
                        <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4 bg-secondary-50/30 dark:bg-secondary-800/20 group-hover:bg-secondary-50/80 dark:group-hover:bg-secondary-800/40 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl dark:bg-purple-900/20 dark:text-purple-400 ring-1 ring-purple-100 dark:ring-purple-800/50">
                                    <PlusCircle className="w-5 h-5" />
                                </div>
                                <div className="flex-1 flex items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-secondary-900 dark:text-white uppercase tracking-tight">Admin Management</CardTitle>
                                        <CardDescription className="text-secondary-500 font-medium text-xs mt-0.5">Invite and authorize new portal administrators.</CardDescription>
                                    </div>
                                    <div className="bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full border border-primary-100 dark:border-primary-800/50">
                                        <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">{staffList.length} AUTHORIZED</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="p-4 rounded-xl text-sm bg-blue-50/50 text-blue-700 border border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/30 flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                <p className="font-semibold italic"><strong>Security Note:</strong> Adding a new administrator grants them full access. Ensure proper vetting before authorization.</p>
                            </div>

                            {/* Enrollment Form */}
                            {/* Enrollment Form */}
                            <div className="bg-secondary-50/50 dark:bg-secondary-800/20 p-4 md:p-6 rounded-2xl border border-secondary-100 dark:border-secondary-800 space-y-4 shadow-inner">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></div>
                                    <h4 className="text-[10px] font-black text-secondary-900 dark:text-white uppercase tracking-[0.2em]">Enroll New Authority</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-500 ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                            <input
                                                type="text"
                                                placeholder="e.g. Abdullah bin Ahmad"
                                                value={inviteName}
                                                onChange={(e) => setInviteName(e.target.value)}
                                                className="flex h-12 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all pl-10 pr-4 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-500 ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                            <input
                                                type="email"
                                                placeholder="staff@masjid.com"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                className="flex h-12 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all pl-10 pr-4 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-500 ml-1">Assign Password</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                            <input
                                                type="password"
                                                placeholder="Min. 8 chars"
                                                value={invitePassword}
                                                onChange={(e) => setInvitePassword(e.target.value)}
                                                className="flex h-12 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all pl-10 pr-4 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-500 ml-1">Assigned Role</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                                            <select
                                                value="admin"
                                                disabled
                                                className="flex h-12 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none bg-secondary-50 dark:bg-secondary-900 text-secondary-500 dark:text-secondary-400 transition-all pl-10 pr-4 shadow-sm appearance-none cursor-not-allowed"
                                            >
                                                <option value="admin">Administrator</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        disabled={isInviting}
                                        onClick={handleEnroll}
                                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 disabled:opacity-50"
                                    >
                                        {isInviting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Provisioning...
                                            </div>
                                        ) : (
                                            <><PlusCircle className="w-4 h-4" /> Create Authority</>
                                        )}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Active/Pending Staff List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="text-[10px] font-black text-secondary-900 dark:text-white uppercase tracking-[0.2em]">Authorized Personnel</h4>
                                    <span className="text-[9px] font-bold text-secondary-400 uppercase">Live Database</span>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {staffList.length === 0 ? (
                                        <div className="py-12 text-center border-2 border-dashed border-secondary-100 dark:border-secondary-800 rounded-2xl">
                                            <User className="w-8 h-8 text-secondary-200 dark:text-secondary-800 mx-auto mb-3" />
                                            <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">No authorized personnel found</p>
                                        </div>
                                    ) : (
                                        staffList.map((staff) => (
                                            <motion.div
                                                key={staff.email}
                                                variants={itemVariants}
                                                className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 bg-white dark:bg-secondary-800/30 rounded-2xl border border-secondary-100 dark:border-secondary-800 hover:shadow-xl hover:border-primary-100 dark:hover:border-primary-900/30 transition-all group relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                                    <div className="relative group/avatar">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-950 flex items-center justify-center ring-1 ring-secondary-200 dark:ring-secondary-800 group-hover/avatar:scale-105 transition-transform shadow-sm">
                                                            <Shield className={cn("w-6 h-6 transition-colors", staff.status === 'active' ? "text-emerald-500" : "text-amber-500")} />
                                                        </div>
                                                        <div className={cn(
                                                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-secondary-900",
                                                            staff.status === 'active' ? "bg-emerald-500" : "bg-amber-500"
                                                        )}></div>
                                                    </div>
                                                    <div className="text-center sm:text-left space-y-1">
                                                        <div className="flex flex-col sm:flex-row items-center gap-2">
                                                            <p className="font-black text-secondary-900 dark:text-white uppercase tracking-tight text-base">{staff.name}</p>
                                                            <span className={cn(
                                                                "text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter border",
                                                                staff.status === 'active'
                                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50"
                                                                    : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50"
                                                            )}>
                                                                {staff.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
                                                                <ShieldCheck className="w-3 h-3" />
                                                                {staff.role}
                                                            </span>
                                                            <span className="hidden sm:block w-1 h-1 rounded-full bg-secondary-300 dark:bg-secondary-700"></span>
                                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-secondary-500 italic">
                                                                <Mail className="w-3 h-3 text-secondary-400" />
                                                                {staff.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pt-4 sm:pt-0 w-full sm:w-auto justify-end">
                                                    {staff.email !== userProfile?.email && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05, x: 2 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleRevoke(staff.email)}
                                                            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-secondary-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-800/50 group/delete shadow-sm hover:shadow-md"
                                                            title="Revoke Portal Access"
                                                        >
                                                            <Trash2 className="w-4 h-4 transition-transform group-hover/delete:rotate-12" />
                                                            <span>Revoke Access</span>
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>


                {/* Notifications */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm transition-all hover:shadow-2xl hover:border-primary-200 dark:hover:border-primary-900/50 rounded-2xl overflow-hidden group">
                        <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4 bg-secondary-50/30 dark:bg-secondary-800/20 group-hover:bg-secondary-50/80 dark:group-hover:bg-secondary-800/40 transition-colors">
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
                            {isFetching ? (
                                <div className="py-8 text-center text-sm text-secondary-400 animate-pulse">Loading preferences...</div>
                            ) : (
                                <>
                                    <label className="flex items-center justify-between py-4 group cursor-pointer hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 px-2 rounded-lg transition-colors">
                                        <div>
                                            <p className="font-bold text-secondary-900 dark:text-white transition-colors group-hover:text-primary-600">New Request Alerts</p>
                                            <p className="text-xs font-medium text-secondary-500 italic">Push notifications for every community submission.</p>
                                        </div>
                                        <div className="relative inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.newRequestAlerts}
                                                onChange={(e) => setSettings({ ...settings, newRequestAlerts: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600 shadow-inner"></div>
                                        </div>
                                    </label>
                                    <label className="flex items-center justify-between py-4 group cursor-pointer hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 px-2 rounded-lg transition-colors">
                                        <div>
                                            <p className="font-bold text-secondary-900 dark:text-white transition-colors group-hover:text-primary-600">Daily Donation Summary</p>
                                            <p className="text-xs font-medium text-secondary-500 italic">Receive a CSV digest of all transactions at midnight.</p>
                                        </div>
                                        <div className="relative inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.dailyDonationSummary}
                                                onChange={(e) => setSettings({ ...settings, dailyDonationSummary: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600 shadow-inner"></div>
                                        </div>
                                    </label>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="lg:col-span-2 flex justify-end pt-4">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading || isFetching}
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

                <Modal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} title="Confirm Preferences">
                    <div className="space-y-4">
                        <p className="text-secondary-600 dark:text-secondary-300 text-sm">
                            Are you sure you want to save these changes to your portal settings?
                        </p>
                        <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg text-sm border border-secondary-100 dark:border-secondary-700">
                            <h4 className="font-bold text-secondary-900 dark:text-white mb-2 text-xs uppercase tracking-wider">Review Changes:</h4>
                            <ul className="space-y-2">
                                <li className="flex items-center justify-between">
                                    <span className="text-secondary-500">New Request Alerts:</span>
                                    <span className={settings.newRequestAlerts ? "text-emerald-600 font-bold" : "text-secondary-400"}>{settings.newRequestAlerts ? "Enabled" : "Disabled"}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-secondary-500">Daily Summary:</span>
                                    <span className={settings.dailyDonationSummary ? "text-emerald-600 font-bold" : "text-secondary-400"}>{settings.dailyDonationSummary ? "Enabled" : "Disabled"}</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsSaveModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmSave}
                                className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all"
                            >
                                Confirm Save
                            </button>
                        </div>
                    </div>
                </Modal>
            </form>
        </motion.div>
    );
}

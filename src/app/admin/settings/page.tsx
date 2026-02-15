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
    const [userProfile, setUserProfile] = useState<any>(null);

    // Staff Management State
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const [invitePassword, setInvitePassword] = useState("");
    const [inviteRole, setInviteRole] = useState<StaffMember['role']>("staff");
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
        } catch (error: any) {
            alert(error.message || "Failed to create staff account.");
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
                                    defaultValue={userProfile?.name || ""}
                                    placeholder={isFetching ? "Loading..." : "Admin User"}
                                    readOnly
                                    className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all px-4 opacity-70 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-secondary-500 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    defaultValue={userProfile?.email || ""}
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
                            <div className="bg-secondary-50/50 dark:bg-secondary-800/20 p-5 rounded-2xl border border-secondary-100 dark:border-secondary-800 space-y-4">
                                <h4 className="text-xs font-bold text-secondary-900 dark:text-white uppercase tracking-widest">Enroll New Authority</h4>
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-500 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Staff Name"
                                            value={inviteName}
                                            onChange={(e) => setInviteName(e.target.value)}
                                            className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all px-4 shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-500 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="staff@masjid.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all px-4 shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-500 ml-1">Assign Password</label>
                                        <input
                                            type="password"
                                            placeholder="Min. 8 chars"
                                            value={invitePassword}
                                            onChange={(e) => setInvitePassword(e.target.value)}
                                            className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all px-4 shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-500 ml-1">Assigned Role</label>
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value as any)}
                                            className="flex h-11 w-full rounded-xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white transition-all px-4 shadow-sm"
                                        >
                                            <option value="staff">Staff</option>
                                            <option value="volunteer">Volunteer</option>
                                            <option value="admin">Admin</option>
                                            <option value="employee">Employee</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        disabled={isInviting}
                                        onClick={handleEnroll}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
                                    >
                                        {isInviting ? "Creating Account..." : <><PlusCircle className="w-4 h-4" /> Create Authority</>}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Active/Pending Staff List */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-secondary-900 dark:text-white uppercase tracking-widest ml-1">Authorized Personnel</h4>
                                <div className="grid gap-3">
                                    {staffList.length === 0 ? (
                                        <div className="py-10 text-center border-2 border-dashed border-secondary-100 dark:border-secondary-800 rounded-2xl text-secondary-400">
                                            No authorized personnel found.
                                        </div>
                                    ) : (
                                        staffList.map((staff) => (
                                            <div key={staff.email} className="flex items-center justify-between p-4 bg-white dark:bg-secondary-800/50 rounded-2xl border border-secondary-100 dark:border-secondary-800 hover:shadow-md transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center ring-1 ring-secondary-100 dark:ring-secondary-800">
                                                        <Shield className={cn("w-5 h-5", staff.status === 'active' ? "text-emerald-500" : "text-amber-500")} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-secondary-900 dark:text-white">{staff.name}</p>
                                                            <span className={cn(
                                                                "text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter",
                                                                staff.status === 'active' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                                            )}>
                                                                {staff.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] font-medium text-secondary-500 mt-0.5">
                                                            <span className="flex items-center gap-1 uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400">{staff.role}</span>
                                                            <span className="w-1 h-1 rounded-full bg-secondary-300"></span>
                                                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {staff.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pr-2">
                                                    {staff.email !== userProfile?.email && (
                                                        <button
                                                            onClick={() => handleRevoke(staff.email)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-secondary-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-800/50 group/delete"
                                                            title="Delete Personnel"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 transition-transform group-hover/delete:scale-110" />
                                                            <span>Remove Access</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
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

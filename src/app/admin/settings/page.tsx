"use client";

import { useState } from "react";
import { User, Bell, Lock, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(false);

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
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-secondary-900 dark:text-secondary-100 font-heading">Settings</h1>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Manage your account preferences and application settings.</p>
            </div>

            <form onSubmit={handleSave} className="grid text-left gap-6 md:grid-cols-2">
                {/* Profile Settings */}
                <Card className="shadow-sm dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 transition-colors">
                    <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-secondary-800 dark:text-secondary-100">Profile Information</CardTitle>
                                <CardDescription className="dark:text-secondary-400">Update your personal details.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Full Name</label>
                            <input
                                type="text"
                                defaultValue="Admin User"
                                className="flex h-10 w-full rounded-md border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Email Address</label>
                            <input
                                type="email"
                                defaultValue="admin@masjidangullia.com"
                                className="flex h-10 w-full rounded-md border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100 transition-colors"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="shadow-sm dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 transition-colors">
                    <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-secondary-800 dark:text-secondary-100">Security</CardTitle>
                                <CardDescription className="dark:text-secondary-400">Manage your password and access.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Current Password</label>
                            <input
                                type="password"
                                className="flex h-10 w-full rounded-md border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">New Password</label>
                            <input
                                type="password"
                                className="flex h-10 w-full rounded-md border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100 transition-colors"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Admin Access Management */}
                <Card className="shadow-sm md:col-span-2 dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 transition-colors">
                    <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-secondary-800 dark:text-secondary-100">Admin Management</CardTitle>
                                <CardDescription className="dark:text-secondary-400">Authorize new administrators for the portal.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm mb-4 border border-blue-100 dark:border-blue-800 transition-colors">
                            <strong>Note:</strong> Adding a new admin will create a new authorized user in the system.
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">New Admin Email</label>
                                <input
                                    type="email"
                                    placeholder="new.admin@masjid.com"
                                    className="flex h-10 w-full rounded-md border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-800 dark:text-secondary-100 transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Temporary Password</label>
                                <input
                                    type="text"
                                    placeholder="Generates logic here..."
                                    className="flex h-10 w-full rounded-md border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-800 dark:text-secondary-100 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-2">
                            <button
                                type="button"
                                className="px-4 py-2 bg-secondary-900 dark:bg-primary-600 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-secondary-800 dark:hover:bg-primary-700 transition-colors"
                                onClick={(e) => {
                                    e.preventDefault();
                                    alert("In a real implementation, this would trigger a Cloud Function to create a user without logging out the current admin.");
                                }}
                            >
                                Create Admin User
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="shadow-sm md:col-span-2 dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 transition-colors">
                    <CardHeader className="border-b border-secondary-100 dark:border-secondary-800 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-secondary-800 dark:text-secondary-100">Notifications</CardTitle>
                                <CardDescription className="dark:text-secondary-400">Choose what updates you want to receive.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between py-3 border-b border-secondary-50 dark:border-secondary-800">
                            <div>
                                <p className="font-medium text-secondary-900 dark:text-secondary-100">New Request Alerts</p>
                                <p className="text-xs text-secondary-500 dark:text-secondary-400">Get notified when a new community request is submitted.</p>
                            </div>
                            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-secondary-300 dark:border-secondary-700 text-primary-600 focus:ring-primary-500 bg-white dark:bg-secondary-800" />
                        </div>
                        <div className="flex items-center justify-between py-3 pt-4">
                            <div>
                                <p className="font-medium text-secondary-900 dark:text-secondary-100">Donation Digests</p>
                                <p className="text-xs text-secondary-500 dark:text-secondary-400">Daily summary of donations received.</p>
                            </div>
                            <input type="checkbox" className="h-4 w-4 rounded border-secondary-300 dark:border-secondary-700 text-primary-600 focus:ring-primary-500 bg-white dark:bg-secondary-800" />
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary-600 dark:bg-primary-700 text-white hover:bg-primary-700 dark:hover:bg-primary-800 h-11 px-8 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                    >
                        {isLoading ? (
                            "Saving..."
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

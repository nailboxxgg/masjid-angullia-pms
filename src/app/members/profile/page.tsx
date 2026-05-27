"use client";

import { useState } from "react";
import { 
    CheckCircle2, 
    Save, 
    Home, 
    Newspaper, 
    Bell, 
    UserRound, 
    Users, 
    HeartHandshake, 
    CalendarCheck, 
    HandHeart, 
    MessageSquareText, 
    LogOut,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { updateMemberProfile } from "@/lib/members";
import { normalizePhoneNumber } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { MemberProfile } from "@/lib/types";

export default function MemberProfilePage() {
    const { user, profile, refreshProfile } = useMember();
    const [showEditForm, setShowEditForm] = useState(false); // Mobile toggling

    if (!profile) return null;

    return (
        <div>
            {/* MOBILE PWA ACCOUNT MENU VIEW */}
            <div className="block md:hidden min-h-screen bg-secondary-50 dark:bg-secondary-950 pb-20">
                {!showEditForm ? (
                    <div className="space-y-4 p-4">
                        {/* Member Header Card */}
                        <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm dark:border-secondary-800 dark:bg-secondary-900 text-center space-y-2">
                            <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                                {profile.displayName[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-secondary-900 dark:text-white">{profile.displayName}</h2>
                                <p className="text-xs text-secondary-400 font-medium">{profile.email}</p>
                            </div>
                            <span className="inline-block px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                                {profile.membershipStatus} Member
                            </span>
                        </div>

                        {/* PWA Settings List Items */}
                        <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-200 dark:border-secondary-800 p-3 shadow-sm divide-y divide-secondary-100 dark:divide-secondary-800">
                            <Link href="/members" className="flex items-center justify-between py-3.5 px-2 hover:bg-secondary-50/50">
                                <div className="flex items-center gap-3">
                                    <Home className="w-4 h-4 text-secondary-500" />
                                    <span className="text-xs font-bold text-secondary-800 dark:text-secondary-200">Overview</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary-300" />
                            </Link>

                            <Link href="/members/updates" className="flex items-center justify-between py-3.5 px-2 hover:bg-secondary-50/50">
                                <div className="flex items-center gap-3">
                                    <Newspaper className="w-4 h-4 text-secondary-500" />
                                    <span className="text-xs font-bold text-secondary-800 dark:text-secondary-200">Updates</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary-300" />
                            </Link>

                            <Link href="/members/notifications" className="flex items-center justify-between py-3.5 px-2 hover:bg-secondary-50/50">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-4 h-4 text-secondary-500" />
                                    <span className="text-xs font-bold text-secondary-800 dark:text-secondary-200">Notifications</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary-300" />
                            </Link>

                            <button onClick={() => setShowEditForm(true)} className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-secondary-50/50 text-left">
                                <div className="flex items-center gap-3">
                                    <UserRound className="w-4 h-4 text-secondary-500" />
                                    <span className="text-xs font-bold text-secondary-800 dark:text-secondary-200">Profile Settings</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary-300" />
                            </button>

                            <Link href="/members/family" className="flex items-center justify-between py-3.5 px-2 hover:bg-secondary-50/50">
                                <div className="flex items-center gap-3">
                                    <Users className="w-4 h-4 text-secondary-500" />
                                    <span className="text-xs font-bold text-secondary-800 dark:text-secondary-200">Family Link</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary-300" />
                            </Link>

                            <Link href="/members/volunteer" className="flex items-center justify-between py-3.5 px-2 hover:bg-secondary-50/50">
                                <div className="flex items-center gap-3">
                                    <HeartHandshake className="w-4 h-4 text-secondary-500" />
                                    <span className="text-xs font-bold text-secondary-800 dark:text-secondary-200">Volunteer</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary-300" />
                            </Link>

                            <Link href="/members/events" className="flex items-center justify-between py-3.5 px-2 hover:bg-secondary-50/50">
                                <div className="flex items-center gap-3">
                                    <CalendarCheck className="w-4 h-4 text-secondary-500" />
                                    <span className="text-xs font-bold text-secondary-800 dark:text-secondary-200">Events</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary-300" />
                            </Link>

                            <Link href="/members/donations" className="flex items-center justify-between py-3.5 px-2 hover:bg-secondary-50/50">
                                <div className="flex items-center gap-3">
                                    <HandHeart className="w-4 h-4 text-secondary-500" />
                                    <span className="text-xs font-bold text-secondary-800 dark:text-secondary-200">Donations</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary-300" />
                            </Link>

                            <Link href="/members/requests" className="flex items-center justify-between py-3.5 px-2 hover:bg-secondary-50/50">
                                <div className="flex items-center gap-3">
                                    <MessageSquareText className="w-4 h-4 text-secondary-500" />
                                    <span className="text-xs font-bold text-secondary-800 dark:text-secondary-200">Requests</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary-300" />
                            </Link>

                            <button 
                                onClick={async () => {
                                    await auth.signOut();
                                    window.location.href = "/login";
                                }} 
                                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-secondary-50/50 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <LogOut className="w-4 h-4 text-red-500" />
                                    <span className="text-xs font-bold text-red-500">Sign Out</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-red-200" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        <button onClick={() => setShowEditForm(false)} className="inline-flex items-center gap-2 text-xs font-black text-secondary-500 hover:text-secondary-800">
                            <ArrowLeft className="w-4 h-4" /> Back to Account Menu
                        </button>
                        <MemberProfileForm key={profile.updatedAt || profile.createdAt} userId={user?.uid} profile={profile} refreshProfile={refreshProfile} />
                    </div>
                )}
            </div>

            {/* STANDARD DESKTOP VIEWPORT LAYOUT */}
            <div className="hidden md:block">
                <MemberProfileForm key={profile.updatedAt || profile.createdAt} userId={user?.uid} profile={profile} refreshProfile={refreshProfile} />
            </div>
        </div>
    );
}

function MemberProfileForm({
    userId,
    profile,
    refreshProfile,
}: {
    userId?: string;
    profile: MemberProfile;
    refreshProfile: () => Promise<void>;
}) {
    const [displayName, setDisplayName] = useState(profile.displayName);
    const [phone, setPhone] = useState(profile.phone || "");
    const [address, setAddress] = useState(profile.address || "");
    const [familyName, setFamilyName] = useState(profile.familyName || "");
    const [preferences, setPreferences] = useState(profile.notificationPreferences);
    const [donationPref, setDonationPref] = useState(profile.donationPreferences || {
        defaultFund: "",
        defaultIsAnonymous: false,
        name: profile.displayName,
        email: profile.email,
        phone: profile.phone || "",
    });
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!userId || !preferences) return;

        setStatus("saving");
        try {
            await updateMemberProfile(userId, {
                displayName,
                phone: phone ? normalizePhoneNumber(phone) : "",
                address,
                familyName,
                notificationPreferences: preferences,
                donationPreferences: donationPref,
            });
            await refreshProfile();
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 2500);
        } catch (error) {
            console.error("Failed to update member profile:", error);
            setStatus("error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                <h1 className="text-2xl font-black text-secondary-900 dark:text-white">Profile Settings</h1>
                <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">Keep your contact details current for registrations, receipts, and masjid updates.</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Full Name</span>
                        <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950" />
                    </label>
                    <label className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Email</span>
                        <input readOnly value={profile.email} className="w-full rounded-lg border border-secondary-200 bg-secondary-100 px-4 py-3 text-sm font-medium text-secondary-500 dark:border-secondary-700 dark:bg-secondary-800" />
                    </label>
                    <label className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Mobile Number</span>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950" placeholder="09... or +63..." />
                    </label>
                    <label className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Family Name</span>
                        <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950" placeholder="Optional" />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Address</span>
                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="h-28 w-full resize-none rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950" />
                    </label>
                </div>
            </section>

            <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                <h2 className="text-lg font-black text-secondary-900 dark:text-white">Donation Preferences</h2>
                <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">Save your default settings to pre-fill future donations.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Preferred Fund</span>
                        <select
                            value={donationPref.defaultFund || ""}
                            onChange={(e) => setDonationPref({ ...donationPref, defaultFund: e.target.value })}
                            className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                        >
                            <option value="">None / Select Fund</option>
                            <option value="General Fund">General Fund</option>
                            <option value="Education Fund">Education Fund</option>
                            <option value="Mosque Upkeep & Construction">Mosque Upkeep & Construction</option>
                            <option value="Community Welfare">Community Welfare</option>
                        </select>
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-secondary-200 p-4 dark:border-secondary-800 md:col-span-2">
                        <div>
                            <span className="text-sm font-bold text-secondary-700 dark:text-secondary-200 block">Donate Anonymously by Default</span>
                            <span className="text-xs text-secondary-400">Your donor identity will be masked on public displays.</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={donationPref.defaultIsAnonymous || false}
                            onChange={(e) => setDonationPref({ ...donationPref, defaultIsAnonymous: e.target.checked })}
                            className="h-5 w-5 accent-primary-600"
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Default Donor Name</span>
                        <input
                            value={donationPref.name || ""}
                            onChange={(e) => setDonationPref({ ...donationPref, name: e.target.value })}
                            className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                            placeholder="Full Name"
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Default Email</span>
                        <input
                            value={donationPref.email || ""}
                            onChange={(e) => setDonationPref({ ...donationPref, email: e.target.value })}
                            className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                            placeholder="Email Address"
                        />
                    </label>
                </div>
            </section>

            <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                <h2 className="text-lg font-black text-secondary-900 dark:text-white">Notification Preferences</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {Object.entries(preferences).map(([key, enabled]) => (
                        <label key={key} className="flex items-center justify-between rounded-lg border border-secondary-200 p-4 dark:border-secondary-800">
                            <span className="capitalize text-sm font-bold text-secondary-700 dark:text-secondary-200">{key.replace(/([A-Z])/g, " $1")}</span>
                            <input
                                type="checkbox"
                                checked={Boolean(enabled)}
                                onChange={(e) => setPreferences({ ...preferences, [key]: e.target.checked })}
                                className="h-5 w-5 accent-primary-600"
                            />
                        </label>
                    ))}
                </div>
            </section>

            {status === "error" && <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">Profile update failed. Please try again.</p>}
            {status === "saved" && <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Profile saved.</p>}

            <button type="submit" disabled={status === "saving"} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 disabled:opacity-60">
                <Save className="h-4 w-4" />
                {status === "saving" ? "Saving..." : "Save Changes"}
            </button>
        </form>
    );
}

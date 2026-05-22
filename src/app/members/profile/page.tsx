"use client";

import { useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { updateMemberProfile } from "@/lib/members";
import { normalizePhoneNumber } from "@/lib/utils";

export default function MemberProfilePage() {
    const { user, profile, refreshProfile } = useMember();

    if (!profile) return null;

    return <MemberProfileForm key={profile.updatedAt || profile.createdAt} userId={user?.uid} profile={profile} refreshProfile={refreshProfile} />;
}

function MemberProfileForm({
    userId,
    profile,
    refreshProfile,
}: {
    userId?: string;
    profile: NonNullable<ReturnType<typeof useMember>["profile"]>;
    refreshProfile: () => Promise<void>;
}) {
    const [displayName, setDisplayName] = useState(profile.displayName);
    const [phone, setPhone] = useState(profile.phone || "");
    const [address, setAddress] = useState(profile.address || "");
    const [familyName, setFamilyName] = useState(profile.familyName || "");
    const [preferences, setPreferences] = useState(profile.notificationPreferences);
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
                <h1 className="text-2xl font-black text-secondary-900 dark:text-white">Profile</h1>
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
                <h2 className="text-lg font-black text-secondary-900 dark:text-white">Notification Preferences</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {Object.entries(preferences).map(([key, enabled]) => (
                        <label key={key} className="flex items-center justify-between rounded-lg border border-secondary-200 p-4 dark:border-secondary-800">
                            <span className="capitalize text-sm font-bold text-secondary-700 dark:text-secondary-200">{key.replace(/([A-Z])/g, " $1")}</span>
                            <input
                                type="checkbox"
                                checked={enabled}
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

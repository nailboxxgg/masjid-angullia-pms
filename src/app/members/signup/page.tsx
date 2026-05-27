"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bell,
    CalendarCheck,
    CheckCircle2,
    Eye,
    EyeOff,
    HandHeart,
    Moon,
    UserPlus,
} from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { cn, isValidPHPhone, normalizePhoneNumber } from "@/lib/utils";
import { MemberProfile } from "@/lib/types";

const defaultPreferences: MemberProfile["notificationPreferences"] = {
    announcements: true,
    events: true,
    donations: true,
    prayerTimes: true,
};

const preferenceOptions: Array<{
    key: keyof MemberProfile["notificationPreferences"];
    label: string;
    icon: typeof Bell;
}> = [
    { key: "announcements", label: "Announcements", icon: Bell },
    { key: "events", label: "Events", icon: CalendarCheck },
    { key: "donations", label: "Donations", icon: HandHeart },
    { key: "prayerTimes", label: "Prayer Times", icon: Moon },
];

const getFriendlySignupError = (message: string) => {
    if (message.includes("auth/email-already-in-use")) return "This email is already registered. Please log in instead.";
    if (message.includes("auth/invalid-email")) return "Please enter a valid email address.";
    if (message.includes("auth/weak-password")) return "Password must be at least 8 characters.";
    if (message.includes("Unable to save member profile")) return "Your account was created, but we could not save your member profile. Please try logging in or contact support.";
    return "Failed to create member account. Please try again.";
};

export default function MemberSignupPage() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [familyName, setFamilyName] = useState("");
    const [address, setAddress] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [preferences, setPreferences] = useState(defaultPreferences);
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [error, setError] = useState("");

    const validateForm = () => {
        if (displayName.trim().length < 2) return "Please enter your full name.";
        if (phone && !isValidPHPhone(phone) && !phone.startsWith("+63")) return "Please enter a valid PH mobile number, such as 09XXXXXXXXX.";
        if (password.length < 8) return "Password must be at least 8 characters.";
        if (password !== confirmPassword) return "Passwords do not match.";
        return "";
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setStatus("submitting");
        setError("");

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            setStatus("error");
            return;
        }

        try {
            const normalizedEmail = email.trim().toLowerCase();
            const trimmedDisplayName = displayName.trim();
            const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

            await updateProfile(credential.user, { displayName: trimmedDisplayName });
            const token = await credential.user.getIdToken(true);
            const response = await fetch("/api/members/register", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    displayName: trimmedDisplayName,
                    email: normalizedEmail,
                    phone: phone ? normalizePhoneNumber(phone) : "",
                    familyName: familyName.trim(),
                    address: address.trim(),
                    notificationPreferences: preferences,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(data?.error || "Unable to save member profile.");
            }

            setStatus("success");
            setTimeout(() => router.push("/"), 2200);
        } catch (err) {
            console.error("Member signup failed:", err);
            setError(err instanceof Error ? getFriendlySignupError(err.message) : "Failed to create member account.");
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-secondary-50 px-4 py-10 dark:bg-secondary-950">
            <div className="mx-auto w-full max-w-3xl">
                <Link href="/login" className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-secondary-700 shadow-sm dark:bg-secondary-900 dark:text-secondary-200">
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                </Link>

                <form onSubmit={handleSubmit} className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                    <div className="mb-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-black text-secondary-900 dark:text-white">Member Registration</h1>
                        <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
                            Create your account to access the website, track donations, register for events, and submit requests.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Full Name</span>
                            <input
                                required
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                                placeholder="Your full name"
                            />
                        </label>
                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Email Address</span>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                                placeholder="you@example.com"
                            />
                        </label>
                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Mobile Number</span>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                                placeholder="09XXXXXXXXX"
                            />
                        </label>
                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Family Name</span>
                            <input
                                value={familyName}
                                onChange={(e) => setFamilyName(e.target.value)}
                                className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                                placeholder="Optional"
                            />
                        </label>
                        <label className="space-y-2 md:col-span-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Address</span>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="h-24 w-full resize-none rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                                placeholder="Optional"
                            />
                        </label>
                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Password</span>
                            <div className="relative">
                                <input
                                    required
                                    minLength={8}
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 pr-12 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                                    placeholder="Minimum 8 characters"
                                />
                                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-secondary-400 hover:text-secondary-700">
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </label>
                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Confirm Password</span>
                            <input
                                required
                                minLength={8}
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                                placeholder="Re-enter password"
                            />
                        </label>
                    </div>

                    <section className="mt-6 rounded-xl border border-secondary-200 p-4 dark:border-secondary-800">
                        <h2 className="text-sm font-black text-secondary-900 dark:text-white">Notification Preferences</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {preferenceOptions.map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => setPreferences((current) => ({ ...current, [option.key]: !current[option.key] }))}
                                    className={cn(
                                        "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                                        preferences[option.key]
                                            ? "border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-primary-200"
                                            : "border-secondary-200 bg-secondary-50 text-secondary-600 dark:border-secondary-800 dark:bg-secondary-950 dark:text-secondary-300"
                                    )}
                                >
                                    <span className="flex items-center gap-2 text-sm font-bold">
                                        <option.icon className="h-4 w-4" />
                                        {option.label}
                                    </span>
                                    <span className="text-xs font-black uppercase tracking-widest">{preferences[option.key] ? "On" : "Off"}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p>}
                    {status === "success" && (
                        <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                            <CheckCircle2 className="h-4 w-4" />
                            Account created. Your membership is awaiting admin approval — you can sign in, but some features stay locked until an admin approves you.
                        </p>
                    )}

                    <button disabled={status === "submitting"} className="mt-6 w-full rounded-lg bg-primary-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 disabled:opacity-60">
                        {status === "submitting" ? "Creating Account..." : "Create Member Account"}
                    </button>

                    <p className="mt-5 text-center text-sm text-secondary-500">
                        Already registered? <Link href="/login" className="font-black text-primary-600 hover:underline">Log in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createMemberProfile } from "@/lib/members";
import { normalizePhoneNumber } from "@/lib/utils";

export default function MemberSignupPage() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setStatus("submitting");
        setError("");

        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName });
            await createMemberProfile(credential.user.uid, {
                displayName,
                email,
                phone: phone ? normalizePhoneNumber(phone) : "",
                address,
            });
            setStatus("success");
            setTimeout(() => router.push("/members"), 1200);
        } catch (err) {
            console.error("Member signup failed:", err);
            setError(err instanceof Error ? err.message : "Failed to create member account.");
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-secondary-50 px-4 py-10 pt-28 dark:bg-secondary-950">
            <div className="mx-auto w-full max-w-xl">
                <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-secondary-700 shadow-sm dark:bg-secondary-900 dark:text-secondary-200">
                    <ArrowLeft className="h-4 w-4" /> Back to Home
                </Link>

                <form onSubmit={handleSubmit} className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                    <div className="mb-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-black text-secondary-900 dark:text-white">Create Member Account</h1>
                        <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
                            Use this account to track your own registrations, donations, requests, and profile details.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950" placeholder="Full Name" />
                        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950" placeholder="Email Address" />
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950" placeholder="Mobile Number (optional)" />
                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="h-24 w-full resize-none rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950" placeholder="Address (optional)" />

                        <div className="relative">
                            <input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 pr-12 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950" placeholder="Password, minimum 8 characters" />
                            <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-secondary-400 hover:text-secondary-700">
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p>}
                    {status === "success" && <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Account created. Opening your dashboard...</p>}

                    <button disabled={status === "submitting"} className="mt-6 w-full rounded-lg bg-primary-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 disabled:opacity-60">
                        {status === "submitting" ? "Creating Account..." : "Create Account"}
                    </button>

                    <p className="mt-5 text-center text-sm text-secondary-500">
                        Already have an account? <Link href="/login" className="font-black text-primary-600 hover:underline">Sign in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

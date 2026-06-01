"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Footer from "../../../components/layout/Footer";
import { useSessionRecovery } from "@/hooks/useSessionRecovery";
import { getMemberProfile } from "@/lib/members";
import { AdminVerificationError, verifyCurrentAdminAccount } from "@/lib/admin-auth";

function LoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [identifier, setIdentifier] = useState("");

    const { savedData, saveProgress, clearProgress } = useSessionRecovery("login", { identifier: "" });

    // Effect to check if there is saved data
    useEffect(() => {
        if (savedData && savedData.identifier && savedData.identifier !== identifier) {
            // Optional: User notification logic could go here or render conditionally
        }
    }, [savedData, identifier]);

    // Handle input change and save progress
    const handleIdentifierChange = (val: string) => {
        setIdentifier(val);
        saveProgress({ identifier: val });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const form = e.target as HTMLFormElement;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        if (!identifier) {
            setError("Please enter your email or phone number.");
            setLoading(false);
            return;
        }

        let loginEmail = identifier;

        // Clean identifier to check if it represents a phone number (e.g. starts with + or contains only digits)
        const isPhone = identifier.startsWith("+") || /^\d{7,}$/.test(identifier.replace(/[\s\-()]/g, ""));

        if (isPhone) {
            try {
                const response = await fetch("/api/auth/resolve-phone", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone: identifier }),
                });

                const data = await response.json();
                if (!response.ok) {
                    setError(data.error || "No account found with this phone number.");
                    setLoading(false);
                    return;
                }
                loginEmail = data.email;
            } catch (err) {
                console.error("Phone resolution error:", err);
                setError("Network error while resolving phone number. Please check your internet connection.");
                setLoading(false);
                return;
            }
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
            const user = userCredential.user;
            clearProgress(); // Success: clear persistence

            try {
                await verifyCurrentAdminAccount(user);
                router.push("/admin");
                return;
            } catch (adminError) {
                if (adminError instanceof AdminVerificationError && adminError.code && adminError.code !== "no_staff") {
                    await auth.signOut();
                    setError(adminError.message);
                    setLoading(false);
                    return;
                }
            }

            const memberProfile = await getMemberProfile(user.uid);
            if (!memberProfile) {
                await auth.signOut();
                setError("No member account found. Please create a member account first.");
                return;
            }

            router.push("/members");
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
                setError("Network connection issue. Please check your connection and try again.");
                return;
            }
            setError("Invalid credentials. Please check your email and password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 transition-colors duration-300">
            {/* Top Navigation */}
            <div className="p-4 sm:p-6 flex items-center justify-start max-w-7xl mx-auto w-full" />

            <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-primary-900 font-heading">
                            Welcome to Masjid Angullia
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Log in to continue, or create a member account if this is your first visit.
                        </p>
                    </div>

                    {savedData && savedData.identifier && savedData.identifier !== identifier && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-primary-50 border border-primary-100 p-3 rounded-lg flex items-center justify-between gap-3"
                        >
                            <p className="text-xs text-primary-700 font-medium">
                                Continue with <span className="font-bold">{savedData.identifier}</span>?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleIdentifierChange(savedData.identifier)}
                                    className="text-[10px] font-bold uppercase tracking-wider text-primary-700 hover:text-primary-800"
                                >
                                    Resume
                                </button>
                                <button
                                    type="button"
                                    onClick={clearProgress}
                                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600"
                                >
                                    Clear
                                </button>
                            </div>
                        </motion.div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4 rounded-md shadow-sm">
                            <div>
                                <label htmlFor="identifier" className="sr-only">Email or Mobile Number</label>
                                <input
                                    id="identifier"
                                    name="identifier"
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => handleIdentifierChange(e.target.value)}
                                    className="relative block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="Email or Mobile Number (+63...)"
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="relative block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "group relative flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-70 transition-all",
                                    loading && "cursor-not-allowed"
                                )}
                            >
                                <LogIn className="h-4 w-4" />
                                {loading ? "Logging in..." : "Log In"}
                            </button>
                            <Link
                                href="/members/signup"
                                className="flex w-full items-center justify-center gap-2 rounded-md border border-primary-200 bg-white px-3 py-2.5 text-sm font-semibold text-primary-700 transition-all hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                                <UserPlus className="h-4 w-4" />
                                Sign Up
                            </Link>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}

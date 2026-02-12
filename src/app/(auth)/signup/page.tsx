"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Make sure to export db from firebase.ts
import { doc, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Footer from "@/components/layout/Footer";
import { useSessionRecovery } from "@/hooks/useSessionRecovery";
import { motion } from "framer-motion";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");

    // Form states
    const [formData, setFormData] = useState({
        familyName: "",
        email: "",
        phoneNumber: "+63"
    });

    const { savedData, recover, saveProgress, clearProgress } = useSessionRecovery("signup", {
        familyName: "",
        email: "",
        phoneNumber: "+63"
    });

    const updateField = (field: string, value: string) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        saveProgress(newData);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const form = e.target as HTMLFormElement;
        const { email, familyName, phoneNumber } = formData;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;
        const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

        // Basic phone validation for +63
        if (!phoneNumber.startsWith("+63") || phoneNumber.length < 12) {
            setError("Phone number must start with +63 and be at least 12 characters long");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Create User/Family Profile
            await setDoc(doc(db, "families", userCredential.user.uid), {
                email,
                familyName,
                phoneNumber,
                createdAt: new Date(),
                role: 'user'
            });

            clearProgress();
            router.push("/");
        } catch (err: unknown) {
            console.error(err);
            setError((err as Error).message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 transition-colors duration-300">
            {/* Top Navigation */}
            <div className="p-4 sm:p-6 flex items-center justify-start max-w-7xl mx-auto w-full">
                <Link
                    href="/"
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-secondary-600 font-medium hover:bg-secondary-50 transition-all shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Home</span>
                </Link>
            </div>

            <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-primary-900 font-heading">
                            Register Family Account
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Already registered? <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in here</Link>
                        </p>
                    </div>

                    {savedData && savedData.email && savedData.email !== formData.email && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-primary-50 border border-primary-100 p-3 rounded-lg flex items-center justify-between gap-3"
                        >
                            <p className="text-xs text-primary-700 font-medium">
                                Resume registration for <span className="font-bold">{savedData.familyName || savedData.email}</span>?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData(recover()!)}
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

                    <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                        <div className="space-y-4 rounded-md shadow-sm">
                            <div>
                                <label htmlFor="familyName" className="sr-only">Family Name</label>
                                <input
                                    id="familyName"
                                    name="familyName"
                                    type="text"
                                    required
                                    value={formData.familyName}
                                    onChange={(e) => updateField("familyName", e.target.value)}
                                    className="relative block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="Family Name (e.g. Abdul Family)"
                                />
                            </div>
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => updateField("email", e.target.value)}
                                    className="relative block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="Email address"
                                />
                            </div>
                            <div>
                                <label htmlFor="phoneNumber" className="sr-only">Mobile Number</label>
                                <input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={(e) => updateField("phoneNumber", e.target.value)}
                                    className="relative block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="Mobile Number (e.g. +639123456789)"
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
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
                            <div className="relative">
                                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    className="relative block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                    placeholder="Confirm Password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
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

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "group relative flex w-full justify-center rounded-md bg-secondary-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-secondary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-70 transition-all",
                                    loading && "cursor-not-allowed"
                                )}
                            >
                                {loading ? "Creating Account..." : "Create Account"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}

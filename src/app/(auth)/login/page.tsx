"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Footer from "@/components/layout/Footer";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import { useSessionRecovery } from "@/hooks/useSessionRecovery";

function LoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [identifier, setIdentifier] = useState("");

    const { savedData, recover, saveProgress, clearProgress } = useSessionRecovery("login", { identifier: "" });

    // Effect to check if there is saved data
    useEffect(() => {
        if (savedData && savedData.identifier && savedData.identifier !== identifier) {
            // Optional: User notification logic could go here or render conditionally
        }
    }, [savedData]);

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

        // If it's a phone number (+63...), resolve to email
        if (identifier.startsWith("+63")) {
            try {
                const familiesRef = collection(db, "families");
                const q = query(familiesRef, where("phoneNumber", "==", identifier), limit(1));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setError("No account found with this phone number.");
                    setLoading(false);
                    return;
                }

                loginEmail = querySnapshot.docs[0].data().email;
            } catch (err) {
                console.error("Phone resolution error:", err);
                setError("Failed to resolve phone number. Please try using your email.");
                setLoading(false);
                return;
            }
        }

        try {
            await signInWithEmailAndPassword(auth, loginEmail, password);
            clearProgress(); // Success: clear persistence
            router.push("/");
        } catch (err: unknown) {
            console.error(err);
            setError("Invalid credentials. For demo, try signing up first.");
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
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Or <Link href="/signup" className="font-medium text-primary-600 hover:text-primary-500">register a new family account</Link>
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

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "group relative flex w-full justify-center rounded-md bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-70 transition-all",
                                    loading && "cursor-not-allowed"
                                )}
                            >
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg className="h-5 w-5 text-primary-500 group-hover:text-primary-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
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

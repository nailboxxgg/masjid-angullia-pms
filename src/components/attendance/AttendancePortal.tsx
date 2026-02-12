"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2, XCircle, Loader2, History as HistoryIcon, MapPin, Smartphone, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { clockIn, clockOut, getUserAttendanceStatus, AttendanceStatus, checkRegistryStatus } from "@/lib/attendance";
import { collection, query, where, getDocs, limit, doc, setDoc } from "firebase/firestore";
import AnimationWrapper from "@/components/ui/AnimationWrapper";

interface AttendancePortalProps {
    onSuccess?: () => void;
    showHomeLink?: boolean;
}

export default function AttendancePortal({ onSuccess, showHomeLink = false }: AttendancePortalProps) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [status, setStatus] = useState<AttendanceStatus>({ isClockedIn: false, lastRecord: null });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [showLocalSuccess, setShowLocalSuccess] = useState(false);
    const [pendingAction, setPendingAction] = useState<"in" | "out" | null>(null);
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

    // Auth states for integrated forms
    const [authMode, setAuthMode] = useState<"login" | "signup">("login");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (!authUser) {
                setUser(null);
                setLoading(false);
            } else {
                setUser(authUser);
                await Promise.all([
                    refreshStatus(authUser.uid),
                    checkUserRegistration(authUser.uid)
                ]);
                setLoading(false);
            }
        });

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        return () => {
            unsubscribe();
            clearInterval(timer);
        };
    }, []);

    const refreshStatus = async (uid: string) => {
        try {
            const currentStatus = await getUserAttendanceStatus(uid);
            setStatus(currentStatus);
        } catch (err) {
            console.error("Error fetching status:", err);
        }
    };

    const checkUserRegistration = async (uid: string) => {
        try {
            const registered = await checkRegistryStatus(uid);
            setIsRegistered(registered);
        } catch (err) {
            console.error("Error checking registration:", err);
            setIsRegistered(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError("");

        const form = e.target as HTMLFormElement;
        const identifier = (form.elements.namedItem("identifier") as HTMLInputElement).value.trim();
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        if (!identifier) {
            setAuthError("Please enter your email or phone number.");
            setAuthLoading(false);
            return;
        }

        let loginEmail = identifier;

        if (identifier.startsWith("+63")) {
            try {
                const familiesRef = collection(db, "families");
                const q = query(familiesRef, where("phoneNumber", "==", identifier), limit(1));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setAuthError("No account found with this phone number.");
                    setAuthLoading(false);
                    return;
                }

                loginEmail = querySnapshot.docs[0].data().email;
            } catch (err) {
                console.error("Phone resolution error:", err);
                setAuthError("Failed to resolve phone number.");
                setAuthLoading(false);
                return;
            }
        }

        try {
            await signInWithEmailAndPassword(auth, loginEmail, password);
        } catch (err: unknown) {
            console.error(err);
            setAuthError("Invalid credentials. Please try again.");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError("");

        const form = e.target as HTMLFormElement;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;
        const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
        const familyName = (form.elements.namedItem("familyName") as HTMLInputElement).value.trim();
        const phoneNumber = (form.elements.namedItem("phoneNumber") as HTMLInputElement).value.trim();

        if (!phoneNumber.startsWith("+63") || phoneNumber.length < 12) {
            setAuthError("Phone number must start with +63 and be at least 12 characters long");
            setAuthLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setAuthError("Passwords do not match");
            setAuthLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "families", userCredential.user.uid), {
                email,
                familyName,
                phoneNumber,
                createdAt: new Date(),
                role: 'user'
            });
        } catch (err: unknown) {
            console.error(err);
            setAuthError((err as Error).message || "Failed to create account");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleClockIn = async () => {
        if (!user) return;
        setActionLoading(true);
        setError("");
        setMessage("");
        try {
            await clockIn(user.uid, user.displayName || user.email?.split('@')[0] || "User", user.email || "");
            await refreshStatus(user.uid);
            setPendingAction("in");
            setShowLocalSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to clock in");
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        if (!user) return;
        setActionLoading(true);
        setError("");
        setMessage("");
        try {
            await clockOut(user.uid, user.displayName || user.email?.split('@')[0] || "User", user.email || "");
            await refreshStatus(user.uid);
            setPendingAction("out");
            setShowLocalSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to clock out");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex p-20 items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (showLocalSuccess) {
        return (
            <AnimationWrapper animation="reveal" duration={0.8}>
                <div className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce-slow">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-secondary-900 dark:text-white font-heading">
                            {pendingAction === "in" ? "Clocked In!" : "Clocked Out!"}
                        </h2>
                        <p className="text-secondary-500 dark:text-secondary-400 mt-2">
                            Your presence has been successfully recorded for today.
                        </p>
                    </div>
                    <div className="pt-4">
                        <p className="text-xs text-secondary-400 uppercase tracking-widest font-bold">Redirecting briefly...</p>
                    </div>
                </div>
            </AnimationWrapper>
        );
    }

    return (
        <div className="max-w-md mx-auto w-full">
            {!user ? (
                <AnimationWrapper animation="reveal" duration={0.8}>
                    <div className="bg-white dark:bg-secondary-900 rounded-3xl overflow-hidden transition-all duration-300">
                        <div className="px-8 pt-6 pb-4 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4 group">
                                <Smartphone className="w-7 h-7" />
                            </div>
                            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white font-heading tracking-tight">
                                {authMode === "login" ? "Sign In" : "Register Family"}
                            </h1>
                            <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400 italic">
                                {authMode === "login"
                                    ? "Sign in to record your presence"
                                    : "Create an account for your family"}
                            </p>
                        </div>

                        <div className="px-8 pb-8">
                            {authMode === "login" ? (
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1 block">Email or Phone</label>
                                        <input
                                            name="identifier"
                                            type="text"
                                            required
                                            placeholder="email@example.com or +63..."
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1 block">Password</label>
                                        <div className="relative">
                                            <input
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                placeholder="••••••••"
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-primary-500 transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {authError && (
                                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-lg text-center animate-shake">
                                            {authError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={authLoading}
                                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In Now"}
                                    </button>

                                    <p className="text-center text-sm text-secondary-500 dark:text-secondary-400 mt-4">
                                        New here?{" "}
                                        <button
                                            type="button"
                                            onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                                            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
                                        >
                                            Register Family
                                        </button>
                                    </p>
                                </form>
                            ) : (
                                <form onSubmit={handleSignup} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1 block">Family Name</label>
                                            <input
                                                name="familyName"
                                                type="text"
                                                required
                                                placeholder="e.g. Abdul Family"
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1 block">Email</label>
                                            <input
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="email@example.com"
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1 block">Phone Number</label>
                                            <input
                                                name="phoneNumber"
                                                type="tel"
                                                required
                                                defaultValue="+63"
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1 block">Password</label>
                                                <div className="relative">
                                                    <input
                                                        name="password"
                                                        type={showPassword ? "text" : "password"}
                                                        required
                                                        placeholder="••••••••"
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-400"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1 block">Confirm</label>
                                                <div className="relative">
                                                    <input
                                                        name="confirmPassword"
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        required
                                                        placeholder="••••••••"
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-400"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {authError && (
                                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-lg text-center animate-shake">
                                            {authError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={authLoading}
                                        className="w-full py-4 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                                    >
                                        {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                                    </button>

                                    <p className="text-center text-sm text-secondary-500 dark:text-secondary-400 mt-4">
                                        Already have an account?{" "}
                                        <button
                                            type="button"
                                            onClick={() => { setAuthMode("login"); setAuthError(""); }}
                                            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
                                        >
                                            Sign In Now
                                        </button>
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </AnimationWrapper>
            ) : (
                <AnimationWrapper animation="reveal" duration={0.8}>
                    <div className="bg-white dark:bg-secondary-900 rounded-3xl overflow-hidden transition-all duration-300">
                        {/* Header */}
                        <div className="px-8 pt-8 pb-4 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4 group">
                                <Clock className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                            </div>
                            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white font-heading tracking-tight">
                                Jama&apos;ah Presence
                            </h1>
                            <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-widest font-bold">
                                {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                            <div className="mt-2 text-3xl font-mono font-bold text-secondary-900 dark:text-primary-400 tracking-widest">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>

                            {/* Registration Badge */}
                            <div className="mt-4 flex justify-center">
                                {isRegistered === true ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/50">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Verified
                                    </div>
                                ) : isRegistered === false ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-800/50">
                                        <XCircle className="w-3 h-3" />
                                        Unregistered
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-white/10 italic">
                                        Checking...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Section */}
                        <div className="px-8 pb-8 space-y-5">
                            <div className={cn(
                                "p-4 rounded-2xl border flex items-center justify-between transition-all duration-500",
                                status.isClockedIn
                                    ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800/30"
                                    : "bg-slate-50 border-slate-100 dark:bg-white/5 dark:border-white/10"
                            )}>
                                <div>
                                    <p className="text-[10px] font-bold text-secondary-400 dark:text-secondary-500 mb-0.5 uppercase tracking-wider">Status</p>
                                    <h3 className={cn(
                                        "text-base font-bold",
                                        status.isClockedIn ? "text-emerald-600 dark:text-emerald-400" : "text-secondary-400 dark:text-secondary-500"
                                    )}>
                                        {status.isClockedIn ? "Clocked In" : "Clocked Out"}
                                    </h3>
                                </div>
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    status.isClockedIn ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" : "bg-slate-200 dark:bg-white/10 text-slate-400"
                                )}>
                                    {status.isClockedIn ? <CheckCircle2 className="w-5 h-5 animate-pulse" /> : <XCircle className="w-5 h-5" />}
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="grid grid-cols-1 gap-3">
                                {!status.isClockedIn ? (
                                    <button
                                        onClick={handleClockIn}
                                        disabled={actionLoading || isRegistered === false}
                                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                                        {isRegistered === false ? "Registry Required" : "Clock In Now"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleClockOut}
                                        disabled={actionLoading || isRegistered === false}
                                        className="w-full py-4 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                                        {isRegistered === false ? "Registry Required" : "Clock Out"}
                                    </button>
                                )}
                            </div>

                            {/* Info */}
                            <div className="pt-4 flex items-center justify-center gap-4 text-[10px] text-secondary-400 dark:text-secondary-600 border-t border-slate-100 dark:border-white/5 uppercase tracking-widest font-bold">
                                <div className="flex items-center gap-1.5 hover:text-primary-400 transition-colors cursor-default">
                                    <MapPin className="w-3 h-3" /> Masjid Angullia
                                </div>
                                <div className="flex items-center gap-1.5 hover:text-primary-400 transition-colors cursor-default">
                                    <HistoryIcon className="w-3 h-3" /> Auto-Logged
                                </div>
                            </div>
                        </div>
                    </div>
                </AnimationWrapper>
            )}
        </div>
    );
}

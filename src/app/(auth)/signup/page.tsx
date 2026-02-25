"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, MessageCircle, Mail, User, ShieldCheck, CheckCircle2 } from "lucide-react";
import Footer from "@/components/layout/Footer";
import FeedbackModal from "@/components/modules/FeedbackModal";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { checkWhitelistStatus, completeStaffSignup, StaffMember } from "@/lib/staff";

export default function SignupPage() {
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'check' | 'signup' | 'success'>('check');

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [authorizedStaff, setAuthorizedStaff] = useState<StaffMember | null>(null);
    const [error, setError] = useState("");

    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const staff = await checkWhitelistStatus(email);
            if (staff) {
                if (staff.status === 'active') {
                    setError("This account is already registered. Please log in.");
                } else {
                    setAuthorizedStaff(staff);
                    setName(staff.name);
                    setStep('signup');
                }
            } else {
                setError("Registration Restricted: This email is not authorized to register.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update Auth Profile
            await updateProfile(user, { displayName: name });

            // Update Staff Collection
            await completeStaffSignup(user.uid, email);

            setStep('success');
        } catch (err: unknown) {
            console.error("Signup error:", err);
            setError(err instanceof Error ? err.message : "Failed to create account.");
        } finally {
            setIsLoading(false);
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
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
                    {step === 'check' && (
                        <div className="space-y-6">
                            <div className="mx-auto bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <Lock className="w-8 h-8 text-primary-600" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900">Portal Authorization</h2>
                                <p className="text-slate-600">
                                    Public registration is restricted. Please enter your authorized email to proceed.
                                </p>
                            </div>

                            <form onSubmit={handleCheckEmail} className="space-y-4 text-left">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Work Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@masjid.com"
                                            className="flex h-12 w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100 italic">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 inline-flex items-center justify-center rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
                                >
                                    {isLoading ? "Verifying..." : "Check Authorization"}
                                </button>
                            </form>

                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-sm text-slate-500 italic mb-3">Family account creation must be done via administration.</p>
                                <button
                                    onClick={() => setIsFeedbackOpen(true)}
                                    className="text-primary-600 font-bold text-sm hover:underline flex items-center justify-center gap-2 mx-auto"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Contact Admin Support
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'signup' && authorizedStaff && (
                        <div className="space-y-6">
                            <div className="mx-auto bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div className="space-y-2 text-center">
                                <h2 className="text-2xl font-bold text-slate-900 uppercase">Identity Confirmed</h2>
                                <p className="text-slate-600 font-medium italic">
                                    Welcome, <span className="text-primary-600 font-bold uppercase">{authorizedStaff.name}</span>! <br />
                                    Customize your credentials for the <span className="text-primary-600 font-bold uppercase">{authorizedStaff.role}</span> portal.
                                </p>
                            </div>

                            <form onSubmit={handleSignup} className="space-y-4 text-left">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="flex h-12 w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 opacity-60">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email (Locked)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="email"
                                            readOnly
                                            value={email}
                                            className="flex h-12 w-full rounded-xl border-slate-200 bg-slate-100 pl-10 pr-4 text-sm font-medium cursor-not-allowed italic"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Create Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            placeholder="Min. 8 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="flex h-12 w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100 italic">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                >
                                    {isLoading ? "Provisioning..." : "Complete Setup"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep('check')}
                                    className="w-full text-center text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-700 transition-colors py-2"
                                >
                                    Go Back
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="space-y-6 py-4">
                            <div className="mx-auto bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Onboarding Complete</h2>
                                <p className="text-slate-600 font-medium italic">
                                    Your account has been successfully provisioned. You now have access to the <span className="text-primary-600 font-bold uppercase">{authorizedStaff?.role}</span> dashboard.
                                </p>
                            </div>

                            <Link
                                href="/admin"
                                className="w-full h-12 inline-flex items-center justify-center rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
                            >
                                Enter Admin Portal
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />

            <Footer />
        </div>
    );
}

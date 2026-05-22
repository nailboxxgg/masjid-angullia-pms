"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import FeedbackModal from "@/components/modules/FeedbackModal";
import Modal from "@/components/ui/modal";
import { authenticateAdminAccount } from "@/lib/admin-auth";

export default function GlobalModals() {
    const pathname = usePathname();
    const router = useRouter();
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const handleOpenFeedback = () => setIsFeedbackOpen(true);
        const handleOpenLogin = () => {
            if (pathname === "/") return;
            setIsAdminLoginOpen(true);
        };
        window.addEventListener('open-feedback-modal', handleOpenFeedback);
        window.addEventListener('open-login-modal', handleOpenLogin);

        return () => {
            window.removeEventListener('open-feedback-modal', handleOpenFeedback);
            window.removeEventListener('open-login-modal', handleOpenLogin);
        };
    }, [pathname]);

    const handleAdminLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        const form = event.target as HTMLFormElement;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        try {
            await authenticateAdminAccount(email, password);
            setIsAdminLoginOpen(false);
            router.push("/admin");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Invalid admin credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />
            <Modal
                isOpen={isAdminLoginOpen}
                onClose={() => setIsAdminLoginOpen(false)}
                title=""
                className="max-w-md bg-white/90 dark:bg-secondary-900/90 backdrop-blur-xl border-secondary-200 dark:border-secondary-800 shadow-2xl rounded-[2rem]"
                hideScrollbar={true}
            >
                <div className="text-center flex flex-col items-center mb-8">
                    <div className="bg-primary-500/10 dark:bg-primary-500/20 p-4 rounded-3xl mb-4 text-primary-600 dark:text-primary-400">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-secondary-900 dark:text-white font-heading">
                        Admin Portal
                    </h2>
                    <p className="mt-2 text-sm font-medium text-secondary-500 dark:text-secondary-400">
                        We will verify this account against the staff database.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleAdminLogin}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="global-admin-email" className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-secondary-500">Email Address</label>
                            <input
                                id="global-admin-email"
                                name="email"
                                type="email"
                                required
                                className="block w-full rounded-2xl border-0 py-4 px-5 text-secondary-900 dark:text-white bg-secondary-100 dark:bg-secondary-800/50 ring-1 ring-inset ring-secondary-200 dark:ring-secondary-700 placeholder:text-secondary-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 text-base sm:text-sm transition-all shadow-inner"
                                placeholder="Admin Email"
                            />
                        </div>
                        <div>
                            <label htmlFor="global-admin-password" className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-secondary-500">Password</label>
                            <div className="relative">
                                <input
                                    id="global-admin-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full rounded-2xl border-0 py-4 pl-5 pr-12 text-secondary-900 dark:text-white bg-secondary-100 dark:bg-secondary-800/50 ring-1 ring-inset ring-secondary-200 dark:ring-secondary-700 placeholder:text-secondary-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 text-base sm:text-sm transition-all shadow-inner"
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-secondary-400 hover:text-primary-500 transition-colors"
                                    onClick={() => setShowPassword((current) => !current)}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-2xl bg-primary-600 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-primary-500 disabled:opacity-70 transition-all shadow-xl shadow-primary-500/25"
                    >
                        {loading ? "Verifying..." : "Sign In & Verify"}
                    </button>
                </form>
            </Modal>
        </>
    );
}

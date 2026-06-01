"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MemberProvider, useMember } from "@/contexts/MemberContext";
import MemberShell from "@/components/members/MemberShell";

function MemberLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { loading, user, profile } = useMember();
    const isSignupPage = pathname === "/members/signup";

    useEffect(() => {
        if (isSignupPage) return;
        if (!loading && (!user || !profile)) {
            router.push("/");
        }
    }, [isSignupPage, loading, user, profile, router]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Dynamically inject Member PWA manifest link
        const link = document.createElement("link");
        link.rel = "manifest";
        link.href = "/api/manifest/member";
        document.head.appendChild(link);

        // Register custom high-performance Service Worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch((err) => {
                console.error("Member SW registration failed:", err);
            });
        }
    }, []);

    if (isSignupPage) {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-secondary-50 dark:bg-secondary-950">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!user || !profile) return null;

    return <MemberShell profile={profile}>{children}</MemberShell>;
}

export default function MemberLayout({ children }: { children: React.ReactNode }) {
    return (
        <MemberProvider>
            <MemberLayoutContent>{children}</MemberLayoutContent>
        </MemberProvider>
    );
}

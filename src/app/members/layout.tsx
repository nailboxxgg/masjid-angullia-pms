"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MemberProvider, useMember } from "@/contexts/MemberContext";
import MemberShell from "@/components/members/MemberShell";

function MemberLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { loading, user, profile } = useMember();

    useEffect(() => {
        if (!loading && (!user || !profile)) {
            router.push("/login");
        }
    }, [loading, user, profile, router]);

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

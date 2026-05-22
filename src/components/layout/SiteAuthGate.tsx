"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const PUBLIC_PATHS = [
    "/login",
    "/signup",
    "/members/signup",
    "/donations/success",
    "/donations/failed",
];

const isPublicPath = (pathname: string) =>
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export default function SiteAuthGate({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || "/";
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const shouldBypass = useMemo(() => (
        pathname.startsWith("/admin") || isPublicPath(pathname)
    ), [pathname]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!loading && !user && !shouldBypass) {
            router.replace("/login");
        }
    }, [loading, router, shouldBypass, user]);

    if (shouldBypass) {
        return <>{children}</>;
    }

    if (loading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-secondary-50 dark:bg-secondary-950">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
            </div>
        );
    }

    return <>{children}</>;
}

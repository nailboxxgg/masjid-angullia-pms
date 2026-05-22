
"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
    const pathname = usePathname();
    const isAuthPath =
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/members/signup";

    // Hide Navbar on admin and auth-first pages.
    if (pathname?.startsWith("/admin") || isAuthPath) {
        return null;
    }

    return <Navbar />;
}

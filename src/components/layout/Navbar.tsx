"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { LockKeyhole } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();

    const handleLogoClick = (e: React.MouseEvent) => {
        if (pathname === "/") {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    };

    return (
        <nav className="bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md border-b border-primary-100 dark:border-secondary-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo & Brand */}
                    <Link
                        href="/"
                        onClick={handleLogoClick}
                        className="flex items-center gap-2 group cursor-pointer"
                    >
                        <div className="relative w-8 h-7 group-hover:scale-100 transition-transform">
                            <Image
                                src="/logo.png"
                                alt="Masid Angullia Logo"
                                fill
                                className="object-contain dark:brightness-110"
                            />
                        </div>
                        <span className="font-heading font-bold text-xl text-primary-900 dark:text-primary-50 tracking-tight">
                            Masjid Angullia
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}
                            className="p-2 text-primary-600/70 hover:text-primary-600 dark:text-primary-400/70 dark:hover:text-primary-400 transition-colors"
                            title="Staff Portal"
                        >
                            <LockKeyhole className="w-5 h-5" />
                        </button>
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </nav>
    );
}

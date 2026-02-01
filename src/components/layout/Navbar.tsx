"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

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
        <nav className="bg-white border-b border-primary-100 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo & Brand */}
                    <Link
                        href="/"
                        onClick={handleLogoClick}
                        className="flex items-center gap-2 group cursor-pointer"
                    >
                        <div className="relative w-8 h-7 group-hover:scale-100 transition-transform">
                            <Image
                                src="/logo.png"
                                alt="Masjid Angullia Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="font-heading font-bold text-xl text-primary-900 tracking-tight">
                            Masjid Angullia
                        </span>
                    </Link>

                    {/* Notification Bell */}
                    <div className="flex items-center">
                        <button className="relative p-2 rounded-full text-secondary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { LockKeyhole, Menu, X, Bell, Calendar, MessageSquare, Users, Home, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
    { label: "Home", href: "/", icon: Home },
    { label: "Announcements", href: "/updates", icon: Bell },
    { label: "Events", href: "/events", icon: Calendar },
    { label: "Donations", href: "/donations", icon: Heart },
    { label: "Concerns & Feedback", href: "/feedback", icon: MessageSquare },
];

export default function Navbar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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
        <nav className={cn(
            "fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b",
            scrolled
                ? "bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl border-primary-100/50 dark:border-secondary-800 py-2 shadow-sm"
                : "bg-white dark:bg-secondary-900 border-transparent py-4"
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-14 items-center">
                    {/* Logo & Brand */}
                    <Link
                        href="/"
                        onClick={handleLogoClick}
                        className="flex items-center gap-2 group cursor-pointer"
                    >
                        <div className="relative w-8 h-8 group-hover:scale-110 transition-transform duration-300">
                            <Image
                                src="/logo.png"
                                alt="Masid Angullia Logo"
                                fill
                                className="object-contain dark:brightness-110"
                            />
                        </div>
                        <span className="font-heading font-black text-xl text-primary-900 dark:text-primary-50 tracking-tight">
                            Masjid Angullia
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                                    pathname === link.href
                                        ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                                        : "text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                                )}
                            >
                                <link.icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2">
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('open-family-registration-modal'))}
                                className="mr-2 px-4 py-2 rounded-xl bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 text-xs font-bold uppercase tracking-widest hover:bg-primary-600 dark:hover:bg-primary-400 hover:text-white transition-all shadow-lg shadow-secondary-900/10"
                            >
                                Register Family
                            </button>

                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}
                                className="p-2.5 rounded-xl text-primary-600/70 hover:text-primary-600 dark:text-primary-400/70 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"
                                title="Admin Portal"
                            >
                                <LockKeyhole className="w-5 h-5" />
                            </button>
                            <ThemeToggle />
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2.5 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="lg:hidden bg-white dark:bg-secondary-900 border-b border-primary-100/50 dark:border-secondary-800 overflow-hidden shadow-xl"
                    >
                        <div className="px-4 py-6 space-y-2">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-black transition-all",
                                        pathname === link.href
                                            ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                                            : "bg-secondary-50 dark:bg-secondary-800/50 text-secondary-900 dark:text-white hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                        pathname === link.href ? "bg-white/20" : "bg-white dark:bg-secondary-800"
                                    )}>
                                        <link.icon className={cn("w-5 h-5", pathname === link.href ? "text-white" : "text-primary-600 dark:text-primary-400")} />
                                    </div>
                                    {link.label}
                                </Link>
                            ))}

                            <hr className="my-4 border-secondary-100 dark:border-secondary-800" />

                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    window.dispatchEvent(new CustomEvent('open-family-registration-modal'));
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-4 mb-3 rounded-2xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-bold text-sm uppercase tracking-widest shadow-lg"
                            >
                                <Users className="w-4 h-4" />
                                Register Family
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        window.dispatchEvent(new CustomEvent('open-login-modal'));
                                    }}
                                    className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-secondary-900 dark:bg-secondary-800 text-white font-bold text-sm"
                                >
                                    <LockKeyhole className="w-4 h-4" />
                                    Admin Portal
                                </button>
                                <div className="flex items-center justify-center py-4 rounded-2xl bg-secondary-100 dark:bg-secondary-800">
                                    <ThemeToggle />
                                    <span className="ml-2 text-sm font-bold text-secondary-600 dark:text-secondary-400">Appearance</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

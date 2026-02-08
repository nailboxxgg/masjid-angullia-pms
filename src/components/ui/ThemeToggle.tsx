"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch by only rendering after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95 shadow-sm"
            aria-label="Toggle theme"
        >
            {isDark ? (
                <Sun className="w-5 h-5 animate-in fade-in zoom-in duration-300" />
            ) : (
                <Moon className="w-5 h-5 animate-in fade-in zoom-in duration-300" />
            )}
        </button>
    );
}

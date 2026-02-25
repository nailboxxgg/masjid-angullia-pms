"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const emptySubscribe = () => () => { };

export default function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

    const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
        const isDark = resolvedTheme === "dark";

        // Fallback for browsers that don't support View Transition API
        if (!document.startViewTransition) {
            setTheme(isDark ? "light" : "dark");
            return;
        }

        // Get the click position, or center of the button if no event
        const x = event.clientX;
        const y = event.clientY;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
            setTheme(isDark ? "light" : "dark");
        });

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
            ];

            document.documentElement.animate(
                {
                    clipPath: isDark ? [...clipPath].reverse() : clipPath,
                },
                {
                    duration: 500,
                    easing: "ease-in-out",
                    pseudoElement: isDark
                        ? "::view-transition-old(root)"
                        : "::view-transition-new(root)",
                }
            );
        });
    };

    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <button
            onClick={toggleTheme}
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95 shadow-sm overflow-hidden"
            aria-label="Toggle theme"
        >
            <div className="relative z-10">
                {isDark ? (
                    <Sun className="w-5 h-5 animate-in fade-in zoom-in duration-300" />
                ) : (
                    <Moon className="w-5 h-5 animate-in fade-in zoom-in duration-300" />
                )}
            </div>
        </button>
    );
}

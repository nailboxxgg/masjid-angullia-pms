"use client";

import { useState, useEffect } from "react";

export function useSessionRecovery<T>(key: string, initialData: T) {
    const [savedData, setSavedData] = useState<T>(initialData);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data on mount
    useEffect(() => {
        const stored = localStorage.getItem(`session_recovery_${key}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Check expiry (10 mins)
                const now = Date.now();
                if (now - parsed.timestamp < 10 * 60 * 1000) {
                    setSavedData(parsed.data);
                } else {
                    localStorage.removeItem(`session_recovery_${key}`);
                }
            } catch (e) {
                console.error("Failed to parse session recovery data", e);
            }
        }
        setIsLoaded(true);
    }, [key]);

    // Save data
    const saveProgress = (data: T) => {
        setSavedData(data);
        localStorage.setItem(`session_recovery_${key}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    };

    // Clear data
    const clearProgress = () => {
        setSavedData(initialData);
        localStorage.removeItem(`session_recovery_${key}`);
    };

    // Recover function (returns data to populate form)
    const recover = () => {
        return savedData;
    };

    return { savedData, isLoaded, recover, saveProgress, clearProgress };
}

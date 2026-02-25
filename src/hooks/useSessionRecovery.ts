"use client";

import { useState, useCallback } from "react";

export function useSessionRecovery<T>(key: string, initialData: T) {
    const [savedData, setSavedData] = useState<T>(() => {
        // Lazy initialization: read from localStorage on first render (client only)
        if (typeof window === 'undefined') return initialData;
        try {
            const stored = localStorage.getItem(`session_recovery_${key}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                const now = Date.now();
                if (now - parsed.timestamp < 10 * 60 * 1000) {
                    return parsed.data as T;
                } else {
                    localStorage.removeItem(`session_recovery_${key}`);
                }
            }
        } catch (e) {
            console.error("Failed to parse session recovery data", e);
        }
        return initialData;
    });

    // Save data
    const saveProgress = useCallback((data: T) => {
        setSavedData(data);
        localStorage.setItem(`session_recovery_${key}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    }, [key]);

    // Clear data
    const clearProgress = useCallback(() => {
        setSavedData(initialData);
        localStorage.removeItem(`session_recovery_${key}`);
    }, [key, initialData]);

    // Recover function (returns data to populate form)
    const recover = useCallback(() => {
        return savedData;
    }, [savedData]);

    return { savedData, isLoaded: true, recover, saveProgress, clearProgress };
}

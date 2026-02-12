"use client";

import { useEffect, useState, useCallback } from "react";

interface SessionData<T> {
    data: T;
    timestamp: number;
}

export function useSessionRecovery<T>(
    key: string,
    initialData: T,
    expirationMs: number = 10 * 60 * 1000 // Default 10 minutes
) {
    const [savedData, setSavedData] = useState<T | null>(null);
    const [isRecovered, setIsRecovered] = useState(false);

    // Initial check for saved data
    useEffect(() => {
        const raw = localStorage.getItem(`session_recovery_${key}`);
        if (raw) {
            try {
                const parsed: SessionData<T> = JSON.parse(raw);
                const age = Date.now() - parsed.timestamp;

                if (age < expirationMs) {
                    setSavedData(parsed.data);
                } else {
                    localStorage.removeItem(`session_recovery_${key}`);
                }
            } catch (err) {
                console.error("Failed to parse session recovery data", err);
                localStorage.removeItem(`session_recovery_${key}`);
            }
        }
    }, [key, expirationMs]);

    const saveProgress = useCallback((data: T) => {
        const sessionPayload: SessionData<T> = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(`session_recovery_${key}`, JSON.stringify(sessionPayload));
    }, [key]);

    const clearProgress = useCallback(() => {
        localStorage.removeItem(`session_recovery_${key}`);
        setSavedData(null);
    }, [key]);

    const recover = useCallback(() => {
        setIsRecovered(true);
        return savedData;
    }, [savedData]);

    return {
        savedData,
        recover,
        saveProgress,
        clearProgress,
        isRecovered
    };
}

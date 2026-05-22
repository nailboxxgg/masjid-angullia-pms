"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getMemberProfile } from "@/lib/members";
import { MemberProfile } from "@/lib/types";

interface MemberContextType {
    user: User | null;
    profile: MemberProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const MemberContext = createContext<MemberContextType>({
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => undefined,
});

export const useMember = () => useContext(MemberContext);

export function MemberProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = async (currentUser: User | null) => {
        if (!currentUser) {
            setProfile(null);
            return;
        }

        const memberProfile = await getMemberProfile(currentUser.uid);
        setProfile(memberProfile);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            setUser(currentUser);

            try {
                await loadProfile(currentUser);
            } catch (error) {
                console.error("Error loading member profile:", error);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const value = useMemo(() => ({
        user,
        profile,
        loading,
        refreshProfile: () => loadProfile(user),
    }), [user, profile, loading]);

    return (
        <MemberContext.Provider value={value}>
            {children}
        </MemberContext.Provider>
    );
}

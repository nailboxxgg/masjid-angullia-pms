"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { verifyCurrentAdminAccount } from "@/lib/admin-auth";

export interface StaffProfile {
    uid: string;
    email: string;
    name: string;
    role: "admin" | "staff";
    status: "active" | "inactive";
    phoneNumber?: string;
    createdAt?: any;
    updatedAt?: any;
}

interface AdminContextType {
    user: User | null;
    profile: StaffProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => undefined,
});

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<StaffProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = async (currentUser: User | null) => {
        if (!currentUser) {
            setProfile(null);
            return;
        }

        try {
            const docRef = doc(db, "staff", currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProfile(docSnap.data() as StaffProfile);
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error("Error fetching staff profile from Firestore:", error);
            setProfile(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            setUser(currentUser);

            if (currentUser) {
                try {
                    await verifyCurrentAdminAccount(currentUser);
                    await loadProfile(currentUser);
                } catch (error) {
                    console.error("Error verifying admin account:", error);
                    await auth.signOut();
                    setUser(null);
                    setProfile(null);
                }
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
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
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};

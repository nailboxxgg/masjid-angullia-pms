"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { verifyCurrentAdminAccount } from "@/lib/admin-auth";

interface AdminContextType {
    user: User | null;
    loading: boolean;
}

const AdminContext = createContext<AdminContextType>({
    user: null,
    loading: true,
});

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    await verifyCurrentAdminAccount(currentUser);
                    setUser(currentUser);
                } catch (error) {
                    console.error("Error verifying admin account:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AdminContext.Provider value={{ user, loading }}>
            {children}
        </AdminContext.Provider>
    );
};

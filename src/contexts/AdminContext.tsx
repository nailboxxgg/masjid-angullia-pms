"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, limit, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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
                setUser(currentUser);
                try {
                    let staffDoc = await getDoc(doc(db, "staff", currentUser.uid));

                    // Resiliency: If not found by UID, try looking up by email (legacy ID)
                    if (!staffDoc.exists() && currentUser.email) {
                        const email = currentUser.email.toLowerCase();
                        const staffRef = collection(db, "staff");
                        const qEmail = query(staffRef, where("email", "==", email), limit(1));
                        const emailSnapshot = await getDocs(qEmail);

                        if (!emailSnapshot.empty) {
                            const legacyDoc = emailSnapshot.docs[0];
                            const staffData = legacyDoc.data();

                            // Auto-migrate to UID-based document
                            const newRef = doc(db, "staff", currentUser.uid);
                            await setDoc(newRef, {
                                ...staffData,
                                uid: currentUser.uid,
                                updatedAt: serverTimestamp()
                            }, { merge: true });

                            // Delete legacy email-named document if it was the ID
                            if (legacyDoc.id === email) {
                                await deleteDoc(legacyDoc.ref);
                            }

                            staffDoc = await getDoc(newRef);
                        }
                    }

                    if (!staffDoc.exists()) {
                        // Not in staff collection — unauthorized
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Error fetching staff doc:", error);
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

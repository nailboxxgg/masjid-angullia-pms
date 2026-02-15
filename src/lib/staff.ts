import { db, firebaseConfig } from "./firebase";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    serverTimestamp,
    orderBy
} from "firebase/firestore";

const STAFF_COLLECTION = "staff";

export interface StaffMember {
    uid?: string;
    email: string;
    name: string;
    role: 'admin' | 'staff' | 'volunteer' | 'employee';
    status: 'pending' | 'active';
    invitedAt: any;
    joinedAt?: any;
    lastLogin?: any;
}

/**
 * Add an email to the whitelist (pending staff)
 */
export const addPendingStaff = async (email: string, name: string, role: StaffMember['role']) => {
    try {
        // Use normalized email as ID if UID is not available yet
        // But since we want to check it during signup, we should probably use a doc with the email as key or query
        // Using email as ID for deterministic lookup during signup
        const docId = email.toLowerCase();
        const staffRef = doc(db, STAFF_COLLECTION, docId);

        const existingDoc = await getDoc(staffRef);
        if (existingDoc.exists() && existingDoc.data().status === 'active') {
            throw new Error("This email is already registered and active.");
        }

        await setDoc(staffRef, {
            email: email.toLowerCase(),
            name,
            role,
            status: 'pending',
            invitedAt: serverTimestamp()
        }, { merge: true });

        return true;
    } catch (error) {
        console.error("Error adding pending staff:", error);
        throw error;
    }
};

/**
 * Get all staff members (both pending and active)
 */
export const getStaffMembers = async (): Promise<StaffMember[]> => {
    try {
        const q = query(collection(db, STAFF_COLLECTION), orderBy("invitedAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            ...doc.data()
        } as StaffMember));
    } catch (error) {
        console.error("Error fetching staff members:", error);
        return [];
    }
};

/**
 * Revoke staff access (delete from collection)
 */
export const revokeStaffAccess = async (email: string) => {
    try {
        const docId = email.toLowerCase();

        // 1. Try deleting by email ID (legacy/pending)
        await deleteDoc(doc(db, STAFF_COLLECTION, docId));

        // 2. Query for documents where email matches (in case ID is UID)
        const q = query(collection(db, STAFF_COLLECTION), where("email", "==", docId));
        const querySnapshot = await getDocs(q);

        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        return true;
    } catch (error) {
        console.error("Error revoking staff access:", error);
        return false;
    }
};

/**
 * Check if an email is in the whitelist (for signup)
 */
export const checkWhitelistStatus = async (email: string): Promise<StaffMember | null> => {
    try {
        const staffDoc = await getDoc(doc(db, STAFF_COLLECTION, email.toLowerCase()));
        if (staffDoc.exists()) {
            return staffDoc.data() as StaffMember;
        }
        return null;
    } catch (error) {
        console.error("Error checking whitelist status:", error);
        return null;
    }
};

/**
 * Complete staff signup (move from pending to active)
 * Migrates document from email-ID to UID-ID
 */
export const completeStaffSignup = async (uid: string, email: string) => {
    try {
        const oldDocId = email.toLowerCase();
        const oldRef = doc(db, STAFF_COLLECTION, oldDocId);
        const oldDoc = await getDoc(oldRef);

        const staffData = oldDoc.exists() ? oldDoc.data() : {};
        const newRef = doc(db, STAFF_COLLECTION, uid);

        await setDoc(newRef, {
            ...staffData,
            uid,
            status: 'active',
            joinedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        }, { merge: true });

        // Delete the old email-based document if it exists and is different from UID
        if (oldDocId !== uid) {
            await deleteDoc(oldRef);
        }

        return true;
    } catch (error) {
        console.error("Error completing staff signup:", error);
        return false;
    }
};

/**
 * Create a staff account directly from the admin panel
 * Uses a secondary Firebase app instance to avoid logging out the admin
 */
export const createStaffAccountDirectly = async (email: string, password: string, name: string, role: StaffMember['role']) => {
    // Unique name for secondary app
    const appName = `staff-creation-${Date.now()}`;
    let secondaryApp;

    try {
        secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getAuth(secondaryApp);

        // 1. Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const user = userCredential.user;

        // 2. Set the display name
        await updateProfile(user, { displayName: name });

        // 3. Create the staff document in Firestore using UID as ID
        const staffRef = doc(db, STAFF_COLLECTION, user.uid);

        await setDoc(staffRef, {
            uid: user.uid,
            email: email.toLowerCase(),
            name,
            role,
            status: 'active',
            invitedAt: serverTimestamp(),
            joinedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });

        // Clean up
        await deleteApp(secondaryApp);
        return true;
    } catch (error: any) {
        if (secondaryApp) await deleteApp(secondaryApp);
        console.error("Error creating staff account directly:", error);
        throw error;
    }
};

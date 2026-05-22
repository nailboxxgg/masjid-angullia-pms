import { User, signInWithEmailAndPassword } from "firebase/auth";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocFromServer,
    getDocs,
    getDocsFromServer,
    limit,
    query,
    serverTimestamp,
    setDoc,
    where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export interface VerifiedAdminSession {
    user: User;
    role: "admin";
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T,>(operation: () => Promise<T>, attempts = 3): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt < attempts) {
                await wait(300 * attempt);
            }
        }
    }

    throw lastError;
};

const getStaffDocFromServerOrCache = async (uid: string) => {
    const staffRef = doc(db, "staff", uid);

    try {
        return await getDocFromServer(staffRef);
    } catch (error) {
        console.warn("Admin staff server lookup failed, falling back to cache:", error);
        return getDoc(staffRef);
    }
};

export const getAdminStaffDoc = async (uid: string, email?: string | null) => withRetry(async () => {
    if (auth.currentUser?.uid === uid) {
        await auth.currentUser.getIdToken(true);
    }

    let staffDoc = await getStaffDocFromServerOrCache(uid);

    if (!staffDoc.exists() && email) {
        const normalizedEmail = email.toLowerCase();
        const staffRef = collection(db, "staff");
        const qEmail = query(staffRef, where("email", "==", normalizedEmail), limit(1));
        let emailSnapshot;

        try {
            emailSnapshot = await getDocsFromServer(qEmail);
        } catch (error) {
            console.warn("Admin staff email server lookup failed, falling back to cache:", error);
            emailSnapshot = await getDocs(qEmail);
        }

        if (!emailSnapshot.empty) {
            const legacyDoc = emailSnapshot.docs[0];
            const staffData = legacyDoc.data();
            const newRef = doc(db, "staff", uid);

            await setDoc(newRef, {
                ...staffData,
                uid,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            if (legacyDoc.id === normalizedEmail) {
                await deleteDoc(legacyDoc.ref);
            }

            try {
                staffDoc = await getDocFromServer(newRef);
            } catch {
                staffDoc = await getDoc(newRef);
            }
        }
    }

    return staffDoc;
});

export const authenticateAdminAccount = async (email: string, password: string): Promise<VerifiedAdminSession> => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    const staffDoc = await getAdminStaffDoc(user.uid, user.email || email);

    if (!staffDoc.exists()) {
        await auth.signOut();
        throw new Error("Access denied. No admin account was found in the staff database.");
    }

    const role = staffDoc.data().role;
    if (role !== "admin") {
        await auth.signOut();
        throw new Error("Access restricted. This account is not authorized for the admin portal.");
    }

    return { user, role: "admin" };
};

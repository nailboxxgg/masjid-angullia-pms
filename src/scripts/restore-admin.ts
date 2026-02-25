import { db } from "../lib/firebase";
import { setDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore";

/**
 * Utility to restore admin role to a user UID
 */
export const promoteToAdmin = async (uid: string, email: string, name: string) => {
    console.log(`Promoting UID: ${uid} to Admin...`);

    try {
        // 1. Ensure record exists in the 'staff' collection
        await setDoc(doc(db, "staff", uid), {
            uid: uid,
            email: email.toLowerCase(),
            name: name,
            role: "admin",
            status: "active",
            invitedAt: serverTimestamp(),
            joinedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        }, { merge: true });

        console.log("Successfully restored admin record in 'staff' collection.");

        // 2. Cleanup: Remove from 'families' collection if it exists there
        try {
            await deleteDoc(doc(db, "families", uid));
            console.log("Cleanup: Removed legacy admin record from 'families' collection.");
        } catch (_cleanupErr) {
            // Non-critical if it doesn't exist
            console.log("Cleanup: No legacy record found in 'families' or already removed.");
        }

    } catch (err) {
        console.error("Error restoring admin record:", err);
    }
};

// --- HOW TO RUN ---
// 1. Go to Firebase Console > Authentication
// 2. Find your UID (long string like 'abc123xyz...')
// 3. Fill in the values below and uncomment the line:

/*
const TARGET_UID = "REPLACE_WITH_YOUR_UID";
const TARGET_EMAIL = "REPLACE_WITH_YOUR_EMAIL";
const TARGET_NAME = "Administrator";

promoteToAdmin(TARGET_UID, TARGET_EMAIL, TARGET_NAME).catch(console.error);
*/

import { db } from "../lib/firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";

/**
 * Utility to restore admin role to a user UID
 */
export const promoteToAdmin = async (uid: string, email: string, name: string) => {
    console.log(`Promoting UID: ${uid} to Admin...`);

    try {
        await setDoc(doc(db, "families", uid), {
            id: uid,
            email: email,
            name: name,
            head: name,
            role: "admin",
            phone: "",
            address: "Administrator Account",
            createdAt: serverTimestamp(),
            members: []
        }, { merge: true });

        console.log("Successfully restored admin record in Firestore.");
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

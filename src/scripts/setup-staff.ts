import { db } from "../lib/firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";

/**
 * Utility to promote/re-add a user to the dedicated STAFF collection
 */
export const promoteToStaff = async (uid: string, email: string, name: string, role: 'admin' | 'staff' | 'employee' = 'admin') => {
    console.log(`Promoting UID: ${uid} to ${role.toUpperCase()} in the STAFF collection...`);

    try {
        await setDoc(doc(db, "staff", uid), {
            uid: uid,
            email: email,
            name: name,
            role: role,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        }, { merge: true });

        console.log(`Successfully added ${name} to the 'staff' collection.`);
    } catch (err) {
        console.error("Error promoting to staff:", err);
    }
};

// --- HOW TO RUN ---
/*
const TARGET_UID = "REPLACE_WITH_YOUR_UID";
const TARGET_EMAIL = "REPLACE_WITH_YOUR_EMAIL";
const TARGET_NAME = "Administrator";

promoteToStaff(TARGET_UID, TARGET_EMAIL, TARGET_NAME, 'admin').catch(console.error);
*/

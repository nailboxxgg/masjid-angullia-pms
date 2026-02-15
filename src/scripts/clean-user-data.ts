import { db } from "../lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

/**
 * Utility to delete all records associated with a specific user UID/Email
 * 
 * WARNING: These actions are permanent.
 */
export const cleanupUserData = async (uid: string, email?: string) => {
    console.log(`Starting cleanup for UID: ${uid}${email ? ` and Email: ${email}` : ''}`);

    const collectionsToClean = [
        { name: "staff", field: "uid" },
        { name: "families", field: "id", isDocId: true },
        { name: "attendance", field: "uid" },
        { name: "event_registrants", field: "uid" },
        { name: "feedback", field: "email", value: email },
        { name: "donations", field: "email", value: email },
    ];

    for (const col of collectionsToClean) {
        try {
            if (col.isDocId) {
                await deleteDoc(doc(db, col.name, uid));
                console.log(`- Checked/Deleted document from ${col.name}`);
                continue;
            }

            const searchValue = col.value || uid;
            if (!searchValue) {
                console.log(`- Skipping ${col.name} (no search value)`);
                continue;
            }

            const q = query(collection(db, col.name), where(col.field, "==", searchValue));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                console.log(`- No records found in ${col.name}`);
                continue;
            }

            const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
            console.log(`- Deleted ${snapshot.size} records from ${col.name}`);
        } catch (err) {
            console.error(`Error cleaning ${col.name}:`, err);
        }
    }

    console.log("Cleanup completed.");
};

// Example usage (commented out for safety):
/*
const TARGET_UID = "REPLACE_WITH_ACTUAL_UID";
const TARGET_EMAIL = "REPLACE_WITH_ACTUAL_EMAIL";
cleanupUserData(TARGET_UID, TARGET_EMAIL).catch(console.error);
*/

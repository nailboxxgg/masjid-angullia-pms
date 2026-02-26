import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";

async function setupAdmin() {
    const email = "[EMAIL_ADDRESS]";
    const password = "[PASSWORD]";
    const name = "Admin";


    console.log(`Attempting to sign in to retrieve UID for ${email}...`);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        console.log(`Successfully authenticated. UID: ${uid}`);

        console.log(`Setting up staff record for UID: ${uid}...`);
        await setDoc(doc(db, "staff", uid), {
            uid: uid,
            email: email,
            name: name,
            role: "admin",
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        }, { merge: true });

        console.log("Admin account successfully set up in the 'staff' collection!");
    } catch (error: unknown) {
        console.error("Error setting up admin account:", error instanceof Error ? error.message : error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/user-not-found') {
            console.log("Note: This account doesn't seem to exist in Firebase Auth yet. Please make sure it's created in the Firebase Console first.");
        }
    }
}

setupAdmin().catch(console.error);

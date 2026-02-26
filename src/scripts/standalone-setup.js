const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, setDoc, serverTimestamp } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyAPtbf7tJLAWnzucwKD7GmrR_hwKYCxNmQ",
    authDomain: "masjid-agullia.firebaseapp.com",
    projectId: "masjid-agullia",
    storageBucket: "masjid-agullia.firebasestorage.app",
    messagingSenderId: "1003466181667",
    appId: "1:1003466181667:web:0129b910ec16f5f601b596",
    measurementId: "G-RKGHMXEHMH"
};

async function setupAdmin() {
    const email = "[EMAIL_ADDRESS]";
    const password = "[PASSWORD]";
    const name = "Admin";

    console.log(`Attempting to sign in for ${email}...`);

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        console.log(`Authenticated. UID: ${uid}`);

        await setDoc(doc(db, "staff", uid), {
            uid: uid,
            email: email,
            name: name,
            role: "admin",
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        }, { merge: true });

        console.log("SUCCESS: Admin account created in 'staff' collection.");
        process.exit(0);
    } catch (error) {
        console.error("FAILURE:", error.message);
        process.exit(1);
    }
}

setupAdmin();

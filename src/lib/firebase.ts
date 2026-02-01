import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyAPtbf7tJLAWnzucwKD7GmrR_hwKYCxNmQ",
    authDomain: "masjid-agullia.firebaseapp.com",
    projectId: "masjid-agullia",
    storageBucket: "masjid-agullia.firebasestorage.app",
    messagingSenderId: "1003466181667",
    appId: "1:1003466181667:web:0129b910ec16f5f601b596",
    measurementId: "G-RKGHMXEHMH"
};

// Initialize Firebase (singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
export default app;

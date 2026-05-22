import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getFunctions, Functions } from "firebase/functions";
import { getStorage, FirebaseStorage } from "firebase/storage";

export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
if (!getApps().length) {
    if (!firebaseConfig.apiKey) {
        console.warn("Firebase API Key is missing. Initializing with empty config (likely during build).");
    }
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

export const db =
    typeof window === "undefined"
        ? getFirestore(app)
        : initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
        });

// Lazy-initialize auth, functions, and storage to avoid
// "auth/invalid-api-key" errors during Next.js build when
// env vars are not available (e.g. CI).
let _auth: Auth;
let _functions: Functions;
let _storage: FirebaseStorage;

export const auth = new Proxy({} as Auth, {
    get(_, prop) {
        if (!_auth) _auth = getAuth(app);
        return Reflect.get(_auth, prop);
    }
});

export const functions = new Proxy({} as Functions, {
    get(_, prop) {
        if (!_functions) _functions = getFunctions(app);
        return Reflect.get(_functions, prop);
    }
});

export const storage = new Proxy({} as FirebaseStorage, {
    get(_, prop) {
        if (!_storage) _storage = getStorage(app);
        return Reflect.get(_storage, prop);
    }
});

export default app;


import { db, auth } from "./firebase";
import {
    collection,
    doc,
    setDoc,
    onSnapshot,
    query,
    where,
    Timestamp,
    serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface AdminPresence {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    lastSeen: number; // millis
    status: 'online' | 'away' | 'offline';
}

const PRESENCE_COLLECTION = "admin_presence";
const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const AWAY_THRESHOLD = 15 * 60 * 1000; // 15 minutes

// Update current user's presence
export const updatePresence = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const presenceRef = doc(db, PRESENCE_COLLECTION, user.uid);

    try {
        await setDoc(presenceRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || "Admin",
            photoURL: user.photoURL || null,
            lastSeen: Date.now(), // Store as number for easier client-side comparison
            lastSeenServer: serverTimestamp() // Store server time for potential robust checks
        }, { merge: true });
    } catch (error) {
        console.error("Error updating presence:", error);
    }
};

// Explicitly set user as offline (used for logout)
export const goOffline = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const presenceRef = doc(db, PRESENCE_COLLECTION, user.uid);
    try {
        await setDoc(presenceRef, {
            lastSeen: 0, // Setting to 0 effectively makes them 'offline' based on thresholds
            status: 'offline'
        }, { merge: true });
    } catch (error) {
        console.error("Error setting offline status:", error);
    }
};

// Subscribe to active admins
export const subscribeToActiveAdmins = (callback: (admins: AdminPresence[]) => void) => {
    // Query admins active in the last 20 minutes (to show somewhat recent history)
    // Note: Firestore query based on time might require an index if mixed with other filters, 
    // but for small admin teams, fetching all and filtering client side is fine.

    const q = query(
        collection(db, PRESENCE_COLLECTION)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const now = Date.now();
        const admins: AdminPresence[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            const lastSeen = data.lastSeen || 0;
            const diff = now - lastSeen;

            let status: AdminPresence['status'] = 'offline';
            if (diff < ONLINE_THRESHOLD) status = 'online';
            else if (diff < AWAY_THRESHOLD) status = 'away';

            // Only push if online or away
            if (status !== 'offline') {
                admins.push({
                    uid: data.uid,
                    email: data.email,
                    displayName: data.displayName,
                    photoURL: data.photoURL,
                    lastSeen,
                    status
                });
            }
        });

        // Sort by status (online first) then name
        admins.sort((a, b) => {
            if (a.status === b.status) return a.displayName.localeCompare(b.displayName);
            return a.status === 'online' ? -1 : 1;
        });

        callback(admins);
    });

    return unsubscribe;
};

// Start heartbeat (call this in the layout)
export const startPresenceHeartbeat = () => {
    // Update immediately
    updatePresence();

    // Update every 2 minutes
    const interval = setInterval(updatePresence, 2 * 60 * 1000);

    // Also update on visibility change (tab focus)
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            updatePresence();
        }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
};

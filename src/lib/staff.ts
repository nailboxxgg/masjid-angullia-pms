import { db, firebaseConfig } from "./firebase";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    updateDoc,
    serverTimestamp,
    orderBy
} from "firebase/firestore";

const STAFF_COLLECTION = "staff";

export interface StaffMember {
    uid?: string;
    email: string;
    name: string;
    role: 'admin' | 'staff' | 'volunteer' | 'employee';
    status: 'pending' | 'active';
    invitedAt: any;
    joinedAt?: any;
    lastLogin?: any;
}

/**
 * Add an email to the whitelist (pending staff)
 */
export const addPendingStaff = async (email: string, name: string, role: StaffMember['role']) => {
    try {
        // Use normalized email as ID if UID is not available yet
        // But since we want to check it during signup, we should probably use a doc with the email as key or query
        // Using email as ID for deterministic lookup during signup
        const docId = email.toLowerCase();
        const staffRef = doc(db, STAFF_COLLECTION, docId);

        const existingDoc = await getDoc(staffRef);
        if (existingDoc.exists() && existingDoc.data().status === 'active') {
            throw new Error("This email is already registered and active.");
        }

        await setDoc(staffRef, {
            email: email.toLowerCase(),
            name,
            role,
            status: 'pending',
            invitedAt: serverTimestamp()
        }, { merge: true });

        return true;
    } catch (error) {
        console.error("Error adding pending staff:", error);
        throw error;
    }
};

/**
 * Get all staff members (both pending and active)
 */
export const getStaffMembers = async (): Promise<StaffMember[]> => {
    try {
        const q = query(collection(db, STAFF_COLLECTION), orderBy("invitedAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            ...doc.data()
        } as StaffMember));
    } catch (error) {
        console.error("Error fetching staff members:", error);
        return [];
    }
};

/**
 * Revoke staff access (delete from collection)
 */
export const revokeStaffAccess = async (email: string) => {
    try {
        const docId = email.toLowerCase();

        // 1. Try deleting by email ID (legacy/pending)
        await deleteDoc(doc(db, STAFF_COLLECTION, docId));

        // 2. Query for documents where email matches (in case ID is UID)
        const q = query(collection(db, STAFF_COLLECTION), where("email", "==", docId));
        const querySnapshot = await getDocs(q);

        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        return true;
    } catch (error) {
        console.error("Error revoking staff access:", error);
        return false;
    }
};

/**
 * Check if an email is in the whitelist (for signup)
 */
export const checkWhitelistStatus = async (email: string): Promise<StaffMember | null> => {
    try {
        const staffDoc = await getDoc(doc(db, STAFF_COLLECTION, email.toLowerCase()));
        if (staffDoc.exists()) {
            return staffDoc.data() as StaffMember;
        }
        return null;
    } catch (error) {
        console.error("Error checking whitelist status:", error);
        return null;
    }
};

/**
 * Complete staff signup (move from pending to active)
 * Migrates document from email-ID to UID-ID
 */
export const completeStaffSignup = async (uid: string, email: string) => {
    try {
        const oldDocId = email.toLowerCase();
        const oldRef = doc(db, STAFF_COLLECTION, oldDocId);
        const oldDoc = await getDoc(oldRef);

        const staffData = oldDoc.exists() ? oldDoc.data() : {};
        const newRef = doc(db, STAFF_COLLECTION, uid);

        await setDoc(newRef, {
            ...staffData,
            uid,
            status: 'active',
            joinedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        }, { merge: true });

        // Delete the old email-based document if it exists and is different from UID
        if (oldDocId !== uid) {
            await deleteDoc(oldRef);
        }

        return true;
    } catch (error) {
        console.error("Error completing staff signup:", error);
        return false;
    }
};

/**
 * Create a staff account directly from the admin panel
 * Uses a secondary Firebase app instance to avoid logging out the admin
 */
export const createStaffAccountDirectly = async (email: string, password: string, name: string, role: StaffMember['role']) => {
    // Unique name for secondary app
    const appName = `staff-creation-${Date.now()}`;
    let secondaryApp;

    try {
        secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getAuth(secondaryApp);

        // 1. Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const user = userCredential.user;

        // 2. Set the display name
        await updateProfile(user, { displayName: name });

        // 3. Create the staff document in Firestore using UID as ID
        const staffRef = doc(db, STAFF_COLLECTION, user.uid);

        await setDoc(staffRef, {
            uid: user.uid,
            email: email.toLowerCase(),
            name,
            role,
            status: 'active',
            invitedAt: serverTimestamp(),
            joinedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });

        // Clean up
        await deleteApp(secondaryApp);
        return true;
    } catch (error: any) {
        if (secondaryApp) await deleteApp(secondaryApp);
        console.error("Error creating staff account directly:", error);
        throw error;
    }
};

// ==========================================
// NEW: ID-BASED ATTENDANCE SYSTEM
// ==========================================

import { Staff, AttendanceRecord, AttendanceSession } from "./types";
import { format } from "date-fns";

const ATTENDANCE_COLLECTION = "attendance";
const SESSIONS_COLLECTION = "attendance_sessions";

// Staff Management (ID Based)
export const createStaff = async (staffData: Omit<Staff, "id" | "createdAt" | "status">): Promise<boolean> => {
    try {
        // Generate a 6-digit ID for simplicity and ease of typing
        let unique = false;
        let staffId = "";

        // Simple retry loop to ensure uniqueness (though collision prob is low for 6 digits)
        while (!unique) {
            const randomId = Math.floor(100000 + Math.random() * 900000).toString();
            staffId = `S-${randomId}`;
            const check = await getDoc(doc(db, STAFF_COLLECTION, staffId));
            if (!check.exists()) unique = true;
        }

        const newStaff: Staff = {
            ...staffData,
            id: staffId,
            createdAt: Date.now(),
            status: 'active'
        };

        // Store using the ID as the document key
        await setDoc(doc(db, STAFF_COLLECTION, staffId), newStaff);
        return true;
    } catch (error) {
        console.error("Error creating staff:", error);
        return false;
    }
};

export const getStaffList = async (): Promise<Staff[]> => {
    try {
        const q = query(collection(db, STAFF_COLLECTION), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        // Filter for documents that match the Staff interface (have 'id' and 'contactNumber')
        const staffList = snapshot.docs
            .map(doc => doc.data() as any)
            .filter(data => data.id && data.id.startsWith('S-')) as Staff[];

        return staffList;
    } catch (error) {
        console.error("Error fetching staff:", error);
        return [];
    }
};

export const getStaffById = async (staffId: string): Promise<Staff | null> => {
    try {
        const docRef = doc(db, STAFF_COLLECTION, staffId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.id && data.id.startsWith('S-')) {
                return data as Staff;
            }
        }
        return null;
    } catch (error) {
        console.error("Error fetching staff by ID:", error);
        return null;
    }
};

export const updateStaff = async (staffId: string, updates: Partial<Staff>): Promise<boolean> => {
    try {
        await setDoc(doc(db, STAFF_COLLECTION, staffId), updates, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating staff:", error);
        return false;
    }
};

export const deleteStaff = async (staffId: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, STAFF_COLLECTION, staffId));
        return true;
    } catch (error) {
        console.error("Error deleting staff:", error);
        return false;
    }
}


// Attendance Logic
export const clockInStaff = async (staffId: string): Promise<{ success: boolean; message: string; staff?: Staff }> => {
    try {
        const staff = await getStaffById(staffId);
        if (!staff) {
            return { success: false, message: "Invalid Staff ID" };
        }
        if (staff.status !== 'active') {
            return { success: false, message: "Staff member is inactive" };
        }

        const today = format(new Date(), "yyyy-MM-dd");
        const sessionsRef = collection(db, SESSIONS_COLLECTION);
        const q = query(
            sessionsRef,
            where("staffId", "==", staffId),
            where("date", "==", today),
            where("status", "==", "active")
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return { success: false, message: `Welcome back ${staff.name}! You are already clocked in.`, staff };
        }

        const timestamp = Date.now();

        // 1. Create Log Entry
        const logId = `${staffId}_in_${timestamp}`;
        const logEntry: AttendanceRecord = {
            id: logId,
            staffId: staff.id,
            displayName: staff.name,
            type: 'clock_in',
            role: staff.role,
            timestamp: timestamp,
            date: today
        };
        await setDoc(doc(db, ATTENDANCE_COLLECTION, logId), logEntry);

        // 2. Create Session
        const sessionId = `${staffId}_${today}_${timestamp}`;
        const sessionEntry: AttendanceSession = {
            id: sessionId,
            staffId: staff.id,
            displayName: staff.name,
            type: 'staff_session',
            role: staff.role,
            date: today,
            clockIn: timestamp,
            status: 'active'
        };
        await setDoc(doc(db, SESSIONS_COLLECTION, sessionId), sessionEntry);

        return { success: true, message: `Time In Recorded: ${format(timestamp, 'hh:mm a')}`, staff };
    } catch (error) {
        console.error("Error clocking in:", error);
        return { success: false, message: "System error during clock in" };
    }
};

export const clockOutStaff = async (staffId: string): Promise<{ success: boolean; message: string; staff?: Staff }> => {
    try {
        const staff = await getStaffById(staffId);
        if (!staff) {
            return { success: false, message: "Invalid Staff ID" };
        }

        const today = format(new Date(), "yyyy-MM-dd");
        const sessionsRef = collection(db, SESSIONS_COLLECTION);
        const q = query(
            sessionsRef,
            where("staffId", "==", staffId),
            where("status", "==", "active")
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, message: "No active Time In found for today." };
        }

        const sessionDoc = snapshot.docs[0];
        const sessionData = sessionDoc.data() as AttendanceSession;
        const timestamp = Date.now();

        // Calculate Duration
        const durationMs = timestamp - sessionData.clockIn;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const durationString = `${hours}h ${minutes}m`;

        // 1. Create Log Entry
        const logId = `${staffId}_out_${timestamp}`;
        const logEntry: AttendanceRecord = {
            id: logId,
            staffId: staff.id,
            displayName: staff.name,
            type: 'clock_out',
            role: staff.role,
            timestamp: timestamp,
            date: today
        };
        await setDoc(doc(db, ATTENDANCE_COLLECTION, logId), logEntry);

        // 2. Update Session
        await updateDoc(doc(db, SESSIONS_COLLECTION, sessionDoc.id), {
            clockOut: timestamp,
            status: 'completed',
            duration: durationString
        });

        return { success: true, message: `Time Out Recorded. Worked: ${durationString}`, staff };

    } catch (error) {
        console.error("Error clocking out:", error);
        return { success: false, message: "System error during clock out" };
    }
};

export const addManualAttendance = async (
    staffId: string,
    date: string,
    clockInTime: string, // "HH:mm" 
    clockOutTime?: string // "HH:mm" optional
): Promise<{ success: boolean; message: string }> => {
    try {
        const staff = await getStaffById(staffId);
        if (!staff) return { success: false, message: "Staff not found" };

        // Construct timestamps
        const [inHours, inMinutes] = clockInTime.split(':').map(Number);
        const inDate = new Date(date);
        inDate.setHours(inHours, inMinutes, 0, 0);
        const inTimestamp = inDate.getTime();

        // 1. Create Lock Entry for Clock In
        const inLogId = `${staffId}_manual_in_${inTimestamp}`;
        const inLogEntry: AttendanceRecord = {
            id: inLogId,
            staffId: staff.id,
            displayName: staff.name,
            type: 'clock_in',
            role: staff.role,
            timestamp: inTimestamp,
            date: date
        };
        await setDoc(doc(db, ATTENDANCE_COLLECTION, inLogId), inLogEntry);

        // 2. Create Session
        const sessionId = `${staffId}_${date}_${inTimestamp}`;
        const sessionEntry: AttendanceSession = {
            id: sessionId,
            staffId: staff.id,
            displayName: staff.name,
            type: 'staff_session',
            role: staff.role,
            date: date,
            clockIn: inTimestamp,
            status: 'active'
        };

        if (clockOutTime) {
            const [outHours, outMinutes] = clockOutTime.split(':').map(Number);
            const outDate = new Date(date);
            outDate.setHours(outHours, outMinutes, 0, 0);
            const outTimestamp = outDate.getTime();

            // Validate times
            if (outTimestamp <= inTimestamp) {
                return { success: false, message: "Clock Out time must be after Clock In time." };
            }

            const durationMs = outTimestamp - inTimestamp;
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

            sessionEntry.clockOut = outTimestamp;
            sessionEntry.status = 'completed';
            sessionEntry.duration = `${hours}h ${minutes}m`;

            // Create Log Entry for Clock Out
            const outLogId = `${staffId}_manual_out_${outTimestamp}`;
            const outLogEntry: AttendanceRecord = {
                id: outLogId,
                staffId: staff.id,
                displayName: staff.name,
                type: 'clock_out',
                role: staff.role,
                timestamp: outTimestamp,
                date: date
            };
            await setDoc(doc(db, ATTENDANCE_COLLECTION, outLogId), outLogEntry);
        }

        await setDoc(doc(db, SESSIONS_COLLECTION, sessionId), sessionEntry);
        return { success: true, message: "Attendance record added manually." };

    } catch (error) {
        console.error("Error adding manual attendance:", error);
        return { success: false, message: "Failed to add record." };
    }
};

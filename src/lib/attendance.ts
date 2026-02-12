
import { db } from "./firebase";
import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    getDoc,
    addDoc,
    runTransaction
} from "firebase/firestore";
import { AttendanceRecord } from "./types";

const ATTENDANCE_COLLECTION = "attendance";

export interface AttendanceStatus {
    isClockedIn: boolean;
    lastRecord: AttendanceRecord | null;
}

/**
 * Get current date as YYYY-MM-DD in local time
 */
export const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Check if user is currently clocked in and get their last record for today
 */
export const getUserAttendanceStatus = async (uid: string): Promise<AttendanceStatus> => {
    const today = getTodayDateString();
    const q = query(
        collection(db, ATTENDANCE_COLLECTION),
        where("uid", "==", uid),
        where("date", "==", today),
        orderBy("timestamp", "desc"),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return { isClockedIn: false, lastRecord: null };
    }

    const lastRecord = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as AttendanceRecord;
    return {
        isClockedIn: lastRecord.type === 'clock_in',
        lastRecord
    };
};

/**
 * Clock in a user with transaction and registry verification
 */
export const clockIn = async (uid: string, displayName: string, email: string) => {
    const today = getTodayDateString();
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION);
    const familiesRef = doc(db, "families", uid);

    await runTransaction(db, async (transaction) => {
        // 1. Verify family registry
        const familyDoc = await transaction.get(familiesRef);
        if (!familyDoc.exists()) {
            throw new Error("You are not registered in the Family Registry. Please contact the administrator.");
        }

        // 2. Check current status within transaction
        const q = query(
            attendanceRef,
            where("uid", "==", uid),
            where("date", "==", today),
            orderBy("timestamp", "desc"),
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        const isClockedIn = !querySnapshot.empty &&
            (querySnapshot.docs[0].data() as AttendanceRecord).type === 'clock_in';

        if (isClockedIn) {
            throw new Error("You are already clocked in.");
        }

        // 3. Create new record
        const attendanceData: Omit<AttendanceRecord, 'id'> = {
            uid,
            displayName,
            email,
            type: 'clock_in',
            timestamp: Date.now(),
            date: today,
            deviceInfo: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'
        };

        const newDocRef = doc(attendanceRef);
        transaction.set(newDocRef, attendanceData);
    });
};

/**
 * Clock out a user with transaction
 */
export const clockOut = async (uid: string, displayName: string, email: string) => {
    const today = getTodayDateString();
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION);

    await runTransaction(db, async (transaction) => {
        // 1. Check current status within transaction
        const q = query(
            attendanceRef,
            where("uid", "==", uid),
            where("date", "==", today),
            orderBy("timestamp", "desc"),
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        const isClockedIn = !querySnapshot.empty &&
            (querySnapshot.docs[0].data() as AttendanceRecord).type === 'clock_in';

        if (!isClockedIn) {
            throw new Error("You are not clocked in.");
        }

        // 2. Create new record
        const attendanceData: Omit<AttendanceRecord, 'id'> = {
            uid,
            displayName,
            email,
            type: 'clock_out',
            timestamp: Date.now(),
            date: today,
            deviceInfo: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'
        };

        const newDocRef = doc(attendanceRef);
        transaction.set(newDocRef, attendanceData);
    });
};

/**
 * Get all attendance logs for a specific date (for admins)
 */
export const getAttendanceLogs = async (dateString?: string): Promise<AttendanceRecord[]> => {
    const targetDate = dateString || getTodayDateString();
    const q = query(
        collection(db, ATTENDANCE_COLLECTION),
        where("date", "==", targetDate),
        orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AttendanceRecord));
};

/**
 * Check if a user is registered in the Family Registry
 */
export const checkRegistryStatus = async (uid: string): Promise<boolean> => {
    try {
        const familyDoc = await getDoc(doc(db, "families", uid));
        return familyDoc.exists();
    } catch (err) {
        console.error("Error checking registry status:", err);
        return false;
    }
};

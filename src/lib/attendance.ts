
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
import { AttendanceRecord, AttendanceSession } from "./types";

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
export const clockIn = async (uid: string, displayName: string, email: string, role: 'volunteer' | 'staff' | 'admin') => {
    const today = getTodayDateString();
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION);
    const staffRef = doc(db, "staff", uid);
    const familiesRef = doc(db, "families", uid);

    await runTransaction(db, async (transaction) => {
        // 1. Verify registry based on role
        // For admin/staff/volunteer roles, we check the 'staff' collection
        // For regular family members (if they use this), we check 'families'
        const isStaffRole = ['admin', 'staff', 'volunteer', 'employee'].includes(role);
        const checkRef = isStaffRole ? staffRef : familiesRef;
        const registryDoc = await transaction.get(checkRef);

        if (!registryDoc.exists()) {
            throw new Error(`You are not registered as ${role.toUpperCase()} in the system. Please contact the administrator.`);
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
            throw new Error("You already have an active clock-in session for today.");
        }

        // 3. Create new record
        const attendanceData: Omit<AttendanceRecord, 'id'> = {
            uid,
            displayName,
            email,
            type: 'clock_in',
            role,
            timestamp: Date.now(),
            date: today,
            deviceInfo: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'
        };

        const newDocRef = doc(attendanceRef);
        transaction.set(newDocRef, attendanceData);
    });
};

/**
 * Check if a visitor has already registered today based on name and phone
 */
export const hasVisitorRegisteredToday = async (name: string, phone?: string): Promise<boolean> => {
    const today = getTodayDateString();
    let q = query(
        collection(db, ATTENDANCE_COLLECTION),
        where("date", "==", today),
        where("type", "==", "visitor"),
        where("displayName", "==", name)
    );

    if (phone) {
        q = query(q, where("phone", "==", phone));
    }

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};

/**
 * Record a simple visitor presence
 */
export const recordVisitorPresence = async (name: string, phone?: string) => {
    // Check for duplicates
    const isRegistered = await hasVisitorRegisteredToday(name, phone);
    if (isRegistered) {
        throw new Error("You have already recorded your visit for today. Thank you!");
    }

    const today = getTodayDateString();
    const attendanceData: Omit<AttendanceRecord, 'id'> = {
        uid: `visitor_${Date.now()}`,
        displayName: name,
        email: "visitor@guest.com",
        phone: phone || "",
        type: 'visitor',
        timestamp: Date.now(),
        date: today,
        deviceInfo: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'
    };

    const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), attendanceData);
    return docRef.id;
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
 * Get attendance sessions (paired In/Out) for a specific date
 */
export const getAttendanceSessions = async (dateString?: string): Promise<AttendanceSession[]> => {
    const rawLogs = await getAttendanceLogs(dateString);

    // Group by user
    const userLogs: Record<string, AttendanceRecord[]> = {};
    rawLogs.forEach(log => {
        if (!userLogs[log.uid]) userLogs[log.uid] = [];
        userLogs[log.uid].push(log);
    });

    const sessions: AttendanceSession[] = [];

    Object.values(userLogs).forEach(logs => {
        // Sort ascending by time
        logs.sort((a, b) => a.timestamp - b.timestamp);

        let currentSession: Partial<AttendanceSession> | null = null;

        logs.forEach(log => {
            if (log.type === 'visitor') {
                sessions.push({
                    id: log.id,
                    uid: log.uid,
                    displayName: log.displayName,
                    email: log.email,
                    phone: log.phone,
                    date: log.date,
                    clockIn: log.timestamp,
                    status: 'visitor',
                    type: 'visitor_log'
                });
            } else if (log.type === 'clock_in') {
                // Start a new session
                // If there was an existing session without clock out, we might want to close it or leave it as error?
                // For now, let's assume valid flow is In -> Out -> In -> Out
                if (currentSession) {
                    // Previous session was not closed. Push it as active (or weird state)
                    sessions.push(currentSession as AttendanceSession);
                }

                currentSession = {
                    id: `${log.uid}_${log.timestamp}`,
                    uid: log.uid,
                    displayName: log.displayName,
                    email: log.email,
                    date: log.date,
                    clockIn: log.timestamp,
                    deviceInfo: log.deviceInfo,
                    status: 'active',
                    type: 'staff_session',
                    role: log.role
                };
            } else if (log.type === 'clock_out') {
                if (currentSession && currentSession.status === 'active') {
                    // Close the session
                    currentSession.clockOut = log.timestamp;
                    currentSession.status = 'completed';

                    // Calculate duration
                    const diffMs = log.timestamp - (currentSession.clockIn || 0);
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    currentSession.duration = `${hours}h ${minutes}m`;

                    sessions.push(currentSession as AttendanceSession);
                    currentSession = null;
                } else {
                    // Orphaned clock out? For now ignore or handle separately
                }
            }
        });

        // If there's a dangling active session at the end
        if (currentSession) {
            sessions.push(currentSession as AttendanceSession);
        }
    });

    // Sort active sessions first, then by clock in time desc
    return sessions.sort((a, b) => {
        if (a.status === b.status) return b.clockIn - a.clockIn;
        return a.status === 'active' ? -1 : 1;
    });
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

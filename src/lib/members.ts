import { db } from "./firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    addDoc,
} from "firebase/firestore";
import { Donation, MemberProfile, MemberServiceRequest, Registrant } from "./types";

const USERS_COLLECTION = "users";
const REQUESTS_COLLECTION = "member_requests";

const toMillis = (value: unknown): number => {
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value === "number") return value;
    return Date.now();
};

const defaultNotificationPreferences: MemberProfile["notificationPreferences"] = {
    announcements: true,
    events: true,
    donations: true,
    prayerTimes: true,
};

export const createMemberProfile = async (
    uid: string,
    profile: Pick<MemberProfile, "displayName" | "email"> & Partial<MemberProfile>
) => {
    const member: Omit<MemberProfile, "id"> = {
        uid,
        displayName: profile.displayName,
        email: profile.email.toLowerCase(),
        phone: profile.phone || "",
        address: profile.address || "",
        familyId: profile.familyId || "",
        familyName: profile.familyName || "",
        membershipStatus: profile.membershipStatus || "active",
        notificationPreferences: profile.notificationPreferences || defaultNotificationPreferences,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    await setDoc(doc(db, USERS_COLLECTION, uid), {
        ...member,
        role: "member",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }, { merge: true });

    return { id: uid, ...member };
};

export const getMemberProfile = async (uid: string): Promise<MemberProfile | null> => {
    const snapshot = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    if (data.role && data.role !== "member") return null;

    return {
        id: snapshot.id,
        uid: data.uid || snapshot.id,
        displayName: data.displayName || data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        familyId: data.familyId || "",
        familyName: data.familyName || "",
        membershipStatus: data.membershipStatus || "active",
        notificationPreferences: {
            ...defaultNotificationPreferences,
            ...(data.notificationPreferences || {}),
        },
        createdAt: toMillis(data.createdAt),
        updatedAt: data.updatedAt ? toMillis(data.updatedAt) : undefined,
    };
};

export const updateMemberProfile = async (uid: string, updates: Partial<MemberProfile>) => {
    const allowedUpdates = {
        displayName: updates.displayName,
        phone: updates.phone,
        address: updates.address,
        familyName: updates.familyName,
        notificationPreferences: updates.notificationPreferences,
        updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, USERS_COLLECTION, uid), allowedUpdates);
};

export const getMemberEventRegistrations = async (uid: string): Promise<Registrant[]> => {
    const q = query(
        collection(db, "event_registrants"),
        where("memberId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
    } as Registrant));
};

export const getMemberDonations = async (uid: string): Promise<Donation[]> => {
    const q = query(
        collection(db, "donations"),
        where("memberId", "==", uid),
        orderBy("date", "desc"),
        limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
            id: docSnapshot.id,
            ...data,
            date: toMillis(data.date),
        } as Donation;
    });
};

export const createMemberServiceRequest = async (
    request: Omit<MemberServiceRequest, "id" | "createdAt" | "updatedAt" | "status">
) => {
    const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), {
        ...request,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getMemberServiceRequests = async (uid: string): Promise<MemberServiceRequest[]> => {
    const q = query(
        collection(db, REQUESTS_COLLECTION),
        where("memberId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
            id: docSnapshot.id,
            memberId: data.memberId,
            memberName: data.memberName,
            memberEmail: data.memberEmail,
            type: data.type,
            subject: data.subject,
            message: data.message,
            status: data.status || "pending",
            createdAt: toMillis(data.createdAt),
            updatedAt: data.updatedAt ? toMillis(data.updatedAt) : undefined,
        } as MemberServiceRequest;
    });
};

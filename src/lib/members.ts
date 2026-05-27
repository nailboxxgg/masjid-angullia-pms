import { db } from "./firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    addDoc,
    runTransaction,
} from "firebase/firestore";
import { Donation, MemberProfile, MemberServiceRequest, Registrant } from "./types";
import { createMemberNotification } from "./member-notifications";

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
        membershipStatus: profile.membershipStatus || "pending",
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
        statusReason: data.statusReason || "",
        statusUpdatedAt: data.statusUpdatedAt ? toMillis(data.statusUpdatedAt) : undefined,
        statusUpdatedBy: data.statusUpdatedBy || undefined,
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
        where("memberId", "==", uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map((docSnapshot) => {
            const data = docSnapshot.data();
            return {
                id: docSnapshot.id,
                ...data,
                createdAt: toMillis(data.createdAt),
            } as Registrant;
        })
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50);
};

export const cancelMemberEventRegistration = async (uid: string, registrationId: string) => {
    const registrationRef = doc(db, "event_registrants", registrationId);

    await runTransaction(db, async (transaction) => {
        const registrationSnapshot = await transaction.get(registrationRef);

        if (!registrationSnapshot.exists()) {
            throw new Error("Registration was not found.");
        }

        const registration = registrationSnapshot.data() as Registrant;

        if (registration.memberId !== uid) {
            throw new Error("You can only cancel your own event registration.");
        }

        if (registration.status === "attended") {
            throw new Error("Attended registrations cannot be cancelled.");
        }

        const eventRef = doc(db, "events", registration.eventId);
        const eventSnapshot = await transaction.get(eventRef);

        transaction.delete(registrationRef);

        if (eventSnapshot.exists()) {
            const eventData = eventSnapshot.data();
            transaction.update(eventRef, {
                registrantsCount: Math.max(0, (eventData.registrantsCount || 0) - 1),
            });
        }
    });
};

export const updateMemberEventRegistration = async (
    uid: string,
    registrationId: string,
    updates: { name: string; contactNumber: string; email: string }
) => {
    const registrationRef = doc(db, "event_registrants", registrationId);

    await runTransaction(db, async (transaction) => {
        const registrationSnapshot = await transaction.get(registrationRef);

        if (!registrationSnapshot.exists()) {
            throw new Error("Registration was not found.");
        }

        const registration = registrationSnapshot.data() as Registrant;

        if (registration.memberId !== uid) {
            throw new Error("You can only update your own event registration.");
        }

        if (registration.status === "attended") {
            throw new Error("Attended registrations cannot be updated.");
        }

        transaction.update(registrationRef, {
            name: updates.name,
            contactNumber: updates.contactNumber,
            email: updates.email,
            updatedAt: Date.now()
        });
    });
};

export const getMemberDonations = async (uid: string): Promise<Donation[]> => {
    const q = query(
        collection(db, "donations"),
        where("memberId", "==", uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map((docSnapshot) => {
            const data = docSnapshot.data();
            return {
                id: docSnapshot.id,
                ...data,
                date: toMillis(data.date),
            } as Donation;
        })
        .sort((a, b) => b.date - a.date)
        .slice(0, 50);
};

export const createMemberServiceRequest = async (
    request: Omit<MemberServiceRequest, "id" | "createdAt" | "updatedAt" | "status">
) => {
    const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), {
        ...request,
        status: "pending",
        adminReply: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    await createMemberNotification({
        memberId: request.memberId,
        type: "request_update",
        title: "Request submitted",
        body: `Your ${request.type} request "${request.subject}" was received and is pending review.`,
        link: "/members/requests",
    });

    return docRef.id;
};

export const getMemberServiceRequests = async (uid: string): Promise<MemberServiceRequest[]> => {
    const q = query(
        collection(db, REQUESTS_COLLECTION),
        where("memberId", "==", uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map((docSnapshot) => {
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
            adminReply: data.adminReply || "",
            repliedAt: data.repliedAt ? toMillis(data.repliedAt) : undefined,
            createdAt: toMillis(data.createdAt),
            updatedAt: data.updatedAt ? toMillis(data.updatedAt) : undefined,
        } as MemberServiceRequest;
        })
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50);
};

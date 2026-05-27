import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { MemberProfile } from "./types";
import { createMemberNotification } from "./member-notifications";

const COLLECTION = "users";

const toMillis = (value: unknown): number | undefined => {
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value === "number") return value;
    return undefined;
};

const mapMember = (id: string, data: Record<string, unknown>): MemberProfile => ({
    id,
    uid: String(data.uid || id),
    displayName: String(data.displayName || data.name || ""),
    email: String(data.email || ""),
    phone: typeof data.phone === "string" ? data.phone : "",
    address: typeof data.address === "string" ? data.address : "",
    familyId: typeof data.familyId === "string" ? data.familyId : "",
    familyName: typeof data.familyName === "string" ? data.familyName : "",
    membershipStatus: (data.membershipStatus as MemberProfile["membershipStatus"]) || "active",
    statusReason: typeof data.statusReason === "string" ? data.statusReason : "",
    statusUpdatedAt: toMillis(data.statusUpdatedAt),
    statusUpdatedBy: typeof data.statusUpdatedBy === "string" ? data.statusUpdatedBy : undefined,
    notificationPreferences: {
        announcements: true,
        events: true,
        donations: true,
        prayerTimes: true,
        ...(data.notificationPreferences as Partial<MemberProfile["notificationPreferences"]> | undefined),
    },
    createdAt: toMillis(data.createdAt) ?? Date.now(),
    updatedAt: toMillis(data.updatedAt),
});

export const listMembers = async (): Promise<MemberProfile[]> => {
    const snapshot = await getDocs(query(collection(db, COLLECTION), where("role", "==", "member")));
    return snapshot.docs
        .map((docSnap) => mapMember(docSnap.id, docSnap.data() as Record<string, unknown>))
        .sort((a, b) => {
            // Pending first, then by createdAt desc
            if (a.membershipStatus === "pending" && b.membershipStatus !== "pending") return -1;
            if (b.membershipStatus === "pending" && a.membershipStatus !== "pending") return 1;
            return b.createdAt - a.createdAt;
        });
};

export const getMemberById = async (uid: string): Promise<MemberProfile | null> => {
    const snap = await getDoc(doc(db, COLLECTION, uid));
    if (!snap.exists()) return null;
    return mapMember(snap.id, snap.data() as Record<string, unknown>);
};

const STATUS_COPY: Record<MemberProfile["membershipStatus"], { title: string; body: (reason?: string) => string }> = {
    active: {
        title: "Membership approved",
        body: (reason) =>
            reason
                ? `Welcome aboard. Your account is active. Note from the admin: ${reason}`
                : "Welcome aboard. Your account is active and you have full access to the member portal.",
    },
    pending: {
        title: "Membership set to pending",
        body: (reason) =>
            reason
                ? `Your account was set back to pending. Reason: ${reason}`
                : "Your account was set back to pending review by an admin.",
    },
    suspended: {
        title: "Membership suspended",
        body: (reason) =>
            reason
                ? `Your membership has been suspended. Reason: ${reason}`
                : "Your membership has been suspended. Please contact the masjid office for details.",
    },
};

export const setMembershipStatus = async (
    uid: string,
    status: MemberProfile["membershipStatus"],
    reason?: string,
): Promise<void> => {
    const acting = auth.currentUser?.uid || "admin";
    await updateDoc(doc(db, COLLECTION, uid), {
        membershipStatus: status,
        statusReason: reason || "",
        statusUpdatedAt: serverTimestamp(),
        statusUpdatedBy: acting,
        updatedAt: serverTimestamp(),
    });

    const copy = STATUS_COPY[status];
    await createMemberNotification({
        memberId: uid,
        type: "membership_status",
        title: copy.title,
        body: copy.body(reason),
        link: "/members",
    });
};

export const countMembersByStatus = (
    members: MemberProfile[],
): Record<MemberProfile["membershipStatus"], number> =>
    members.reduce(
        (acc, member) => {
            acc[member.membershipStatus] = (acc[member.membershipStatus] || 0) + 1;
            return acc;
        },
        { active: 0, pending: 0, suspended: 0 } as Record<MemberProfile["membershipStatus"], number>,
    );

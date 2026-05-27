import {
    addDoc,
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { MemberNotification, MemberNotificationType } from "./types";

const COLLECTION = "notifications";

const toMillis = (value: unknown): number => {
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value === "number") return value;
    return Date.now();
};

export interface CreateNotificationInput {
    memberId: string;
    type: MemberNotificationType;
    title: string;
    body: string;
    link?: string;
}

export const createMemberNotification = async (input: CreateNotificationInput): Promise<string | null> => {
    if (!input.memberId) return null;
    try {
        const docRef = await addDoc(collection(db, COLLECTION), {
            memberId: input.memberId,
            type: input.type,
            title: input.title,
            body: input.body,
            link: input.link || "",
            read: false,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Failed to create notification:", error);
        return null;
    }
};

const mapNotification = (docSnap: { id: string; data: () => Record<string, unknown> }): MemberNotification => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        memberId: String(data.memberId || ""),
        type: (data.type as MemberNotificationType) || "system",
        title: String(data.title || ""),
        body: String(data.body || ""),
        link: data.link ? String(data.link) : undefined,
        read: Boolean(data.read),
        createdAt: toMillis(data.createdAt),
    };
};

export const getMemberNotifications = async (memberId: string, max = 100): Promise<MemberNotification[]> => {
    if (!memberId) return [];
    try {
        const ordered = query(
            collection(db, COLLECTION),
            where("memberId", "==", memberId),
            orderBy("createdAt", "desc"),
            limit(max)
        );
        const snapshot = await getDocs(ordered);
        return snapshot.docs.map(mapNotification);
    } catch (error) {
        console.warn("Falling back to client-side notification sort:", error);
        try {
            const fallback = query(collection(db, COLLECTION), where("memberId", "==", memberId));
            const snapshot = await getDocs(fallback);
            return snapshot.docs
                .map(mapNotification)
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, max);
        } catch (innerError) {
            console.error("Failed to load notifications:", innerError);
            return [];
        }
    }
};

export const markMemberNotificationRead = async (notificationId: string) => {
    await updateDoc(doc(db, COLLECTION, notificationId), { read: true });
};

export const markAllMemberNotificationsRead = async (memberId: string, notifications: MemberNotification[]) => {
    const unread = notifications.filter((n) => n.memberId === memberId && !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((notification) => {
        batch.update(doc(db, COLLECTION, notification.id), { read: true });
    });
    await batch.commit();
};

export const countUnreadNotifications = (notifications: MemberNotification[]): number =>
    notifications.reduce((count, notification) => (notification.read ? count : count + 1), 0);

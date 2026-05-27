"use server";

import { adminDb } from "@/lib/firebase-admin";
import { MemberNotification, MemberNotificationType } from "@/lib/types";

const COLLECTION = "notifications";

// Helper to convert Firestore timestamp/number to milliseconds
const toMillis = (value: any): number => {
    if (!value) return Date.now();
    if (typeof value.toMillis === "function") return value.toMillis();
    if (value._seconds) return value._seconds * 1000;
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

export const createMemberNotificationServer = async (input: CreateNotificationInput): Promise<string | null> => {
    if (!input.memberId) return null;
    try {
        const docRef = await adminDb.collection(COLLECTION).add({
            memberId: input.memberId,
            type: input.type,
            title: input.title,
            body: input.body,
            link: input.link || "",
            read: false,
            createdAt: new Date(), // Using JS Date for admin SDK server side
        });
        return docRef.id;
    } catch (error) {
        console.error("Failed to create notification on server:", error);
        return null;
    }
};

export const getMemberNotificationsServer = async (memberId: string, max = 100): Promise<MemberNotification[]> => {
    if (!memberId) return [];
    try {
        const snapshot = await adminDb
            .collection(COLLECTION)
            .where("memberId", "==", memberId)
            .get();

        const list = snapshot.docs.map((docSnap) => {
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
            } as MemberNotification;
        });

        // Sort in memory by createdAt desc
        return list
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, max);
    } catch (error) {
        console.error("Failed to load notifications on server:", error);
        return [];
    }
};

export const markMemberNotificationReadServer = async (notificationId: string): Promise<boolean> => {
    if (!notificationId) return false;
    try {
        await adminDb.collection(COLLECTION).doc(notificationId).update({ read: true });
        return true;
    } catch (error) {
        console.error("Failed to mark notification read on server:", error);
        return false;
    }
};

export const markAllMemberNotificationsReadServer = async (
    memberId: string,
    notifications: MemberNotification[]
): Promise<boolean> => {
    const unread = notifications.filter((n) => n.memberId === memberId && !n.read);
    if (unread.length === 0) return true;
    try {
        const batch = adminDb.batch();
        unread.forEach((notification) => {
            const ref = adminDb.collection(COLLECTION).doc(notification.id);
            batch.update(ref, { read: true });
        });
        await batch.commit();
        return true;
    } catch (error) {
        console.error("Failed to mark all notifications read on server:", error);
        return false;
    }
};

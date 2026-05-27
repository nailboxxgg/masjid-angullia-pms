import {
    collection,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    doc,
} from "firebase/firestore";
import { db } from "./firebase";
import { MemberServiceRequest } from "./types";
import { createMemberNotification } from "./member-notifications";

const REQUESTS_COLLECTION = "member_requests";

const toMillis = (value: unknown): number => {
    if (typeof value === "object" && value !== null && "toMillis" in value && typeof value.toMillis === "function") {
        return value.toMillis();
    }
    if (typeof value === "number") return value;
    return Date.now();
};

export const getAllMemberServiceRequests = async (): Promise<MemberServiceRequest[]> => {
    const snapshot = await getDocs(query(collection(db, REQUESTS_COLLECTION)));

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
        .sort((a, b) => b.createdAt - a.createdAt);
};

export const updateMemberServiceRequest = async (
    requestId: string,
    updates: Pick<MemberServiceRequest, "status"> & { adminReply?: string }
) => {
    const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
    const beforeSnap = await getDoc(requestRef);
    const before = beforeSnap.exists() ? beforeSnap.data() : null;

    await updateDoc(requestRef, {
        status: updates.status,
        adminReply: updates.adminReply || "",
        repliedAt: updates.adminReply ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
    });

    if (!before) return;
    const memberId: string = before.memberId;
    const subject: string = before.subject || "your request";
    const previousStatus: string = before.status || "pending";
    const previousReply: string = before.adminReply || "";

    const replyChanged = (updates.adminReply || "") && (updates.adminReply || "") !== previousReply;
    const statusChanged = updates.status && updates.status !== previousStatus;

    if (replyChanged) {
        await createMemberNotification({
            memberId,
            type: "request_reply",
            title: "Admin replied to your request",
            body: `New reply on "${subject}".`,
            link: "/members/requests",
        });
    } else if (statusChanged) {
        await createMemberNotification({
            memberId,
            type: "request_update",
            title: "Request status updated",
            body: `"${subject}" is now ${updates.status.replace("_", " ")}.`,
            link: "/members/requests",
        });
    }
};

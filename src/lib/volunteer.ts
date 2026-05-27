import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    Timestamp,
    where,
} from "firebase/firestore";
import { db } from "./firebase";
import { VolunteerRegistration } from "./types";
import { createMemberNotification } from "./member-notifications";

const COLLECTION = "event_volunteers";

const toMillis = (value: unknown): number => {
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value === "number") return value;
    return Date.now();
};

const mapVolunteer = (id: string, data: Record<string, unknown>): VolunteerRegistration => ({
    id,
    eventId: String(data.eventId || ""),
    memberId: String(data.memberId || ""),
    memberName: String(data.memberName || ""),
    memberEmail: String(data.memberEmail || ""),
    notes: typeof data.notes === "string" ? data.notes : undefined,
    status: (data.status as VolunteerRegistration["status"]) || "registered",
    createdAt: toMillis(data.createdAt),
    updatedAt: data.updatedAt ? toMillis(data.updatedAt) : undefined,
});

export const registerAsVolunteer = async (
    eventId: string,
    details: { memberId: string; memberName: string; memberEmail: string; notes?: string },
    eventTitle?: string,
): Promise<{ success: boolean; error?: string }> => {
    try {
        // Check for existing registration
        const existing = query(
            collection(db, COLLECTION),
            where("eventId", "==", eventId),
            where("memberId", "==", details.memberId),
        );
        const snapshot = await getDocs(existing);
        if (!snapshot.empty) {
            return { success: false, error: "You are already registered as a volunteer for this event." };
        }

        await addDoc(collection(db, COLLECTION), {
            eventId,
            memberId: details.memberId,
            memberName: details.memberName,
            memberEmail: details.memberEmail,
            notes: details.notes || "",
            status: "registered",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        await createMemberNotification({
            memberId: details.memberId,
            type: "event_registration",
            title: "Volunteer registration confirmed",
            body: `You signed up to volunteer for ${eventTitle || "an event"}.`,
            link: "/members/volunteer",
        });

        return { success: true };
    } catch (error) {
        console.error("Volunteer registration failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to register." };
    }
};

export const cancelVolunteerRegistration = async (
    memberId: string,
    registrationId: string,
): Promise<void> => {
    const ref = doc(db, COLLECTION, registrationId);
    // No transaction needed — just verify ownership via query below
    const snapshot = await getDocs(
        query(collection(db, COLLECTION), where("memberId", "==", memberId)),
    );
    const match = snapshot.docs.find((d) => d.id === registrationId);
    if (!match) throw new Error("Registration not found or you don't own it.");
    await deleteDoc(ref);
};

export const getMemberVolunteerRegistrations = async (
    memberId: string,
): Promise<VolunteerRegistration[]> => {
    if (!memberId) return [];
    try {
        const snapshot = await getDocs(
            query(collection(db, COLLECTION), where("memberId", "==", memberId)),
        );
        return snapshot.docs
            .map((d) => mapVolunteer(d.id, d.data() as Record<string, unknown>))
            .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error("Failed to load volunteer registrations:", error);
        return [];
    }
};

export const getEventVolunteerCount = async (eventId: string): Promise<number> => {
    const snapshot = await getDocs(
        query(collection(db, COLLECTION), where("eventId", "==", eventId)),
    );
    return snapshot.size;
};

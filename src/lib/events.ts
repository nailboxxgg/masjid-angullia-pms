
import { db, auth } from "./firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    doc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    runTransaction
} from "firebase/firestore";
import { Event } from "./types";

const COLLECTION_NAME = "events";

export const getEvents = async (limitCount = 20): Promise<Event[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy("date", "asc"), // Upcoming events first (assuming ISO date string)
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Event));
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
};

export const createEvent = async (event: Omit<Event, "id" | "registrantsCount">) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...event,
            registrantsCount: 0,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating event:", error);
        return null;
    }
};

export const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, updates);
        return true;
    } catch (error) {
        console.error("Error updating event:", error);
        return false;
    }
};

export interface Registrant {
    id?: string;
    eventId: string;
    name: string;
    email: string; // Optional if not provided
    contactNumber: string;
    createdAt: number;
}

export const registerForEvent = async (eventId: string, details: Omit<Registrant, "id" | "eventId" | "createdAt">) => {
    try {
        const eventRef = doc(db, COLLECTION_NAME, eventId);
        const registrantsRef = collection(db, "event_registrants");

        // Run as transaction to ensure capacity isn't exceeded and count is accurate
        await runTransaction(db, async (transaction) => {
            const eventDoc = await transaction.get(eventRef);
            if (!eventDoc.exists()) {
                throw new Error("Event does not exist!");
            }

            const eventData = eventDoc.data() as Event;
            if (eventData.capacity && eventData.registrantsCount >= eventData.capacity) {
                throw new Error("Event is full!");
            }
            if (!eventData.registrationOpen) {
                throw new Error("Registration is closed!");
            }

            // Add registrant
            const newRegistrantRef = doc(registrantsRef);
            transaction.set(newRegistrantRef, {
                eventId,
                ...details,
                createdAt: Date.now()
            });

            // Increment count
            transaction.update(eventRef, {
                registrantsCount: (eventData.registrantsCount || 0) + 1
            });
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error registering for event:", error);
        return { success: false, error: error.message };
    }
};

// ... existing exports

export const getRegistrants = async (eventId: string): Promise<Registrant[]> => {
    try {
        const q = query(
            collection(db, "event_registrants"),
            where("eventId", "==", eventId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Registrant));
    } catch (error) {
        console.error("Error fetching registrants:", error);
        return [];
    }
};

export const deleteEvent = async (id: string) => {
    try {
        // 1. Delete associated registrants first to avoid orphans
        const registrantsQuery = query(
            collection(db, "event_registrants"),
            where("eventId", "==", id)
        );
        const registrantsSnapshot = await getDocs(registrantsQuery);

        // Execute deletes in a batch (limit 500 operations, usually sufficient for this scale)
        const { writeBatch } = await import("firebase/firestore");
        const batch = writeBatch(db);

        registrantsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // 2. Delete the event document
        const eventRef = doc(db, COLLECTION_NAME, id);
        batch.delete(eventRef);

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error deleting event and registrants:", error);
        return false;
    }
};


import { db } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";
import { Announcement } from "./types";

const COLLECTION_NAME = "announcements";

export const getAnnouncements = async (limitCount = 10): Promise<Announcement[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                content: data.content,
                date: data.date,
                type: data.type,
                priority: data.priority,
                imageUrl: data.imageUrl,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now()
            } as Announcement;
        });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return [];
    }
};

export const createAnnouncement = async (announcement: Omit<Announcement, "id" | "createdAt">): Promise<string | null> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...announcement,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating announcement:", error);
        return null;
    }
};

export const deleteAnnouncement = async (id: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return true;
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return false;
    }
};

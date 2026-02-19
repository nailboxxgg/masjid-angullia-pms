
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
    Timestamp,
    updateDoc,
    arrayUnion,
    arrayRemove,
    getDoc
} from "firebase/firestore";
import { Announcement, Comment } from "./types";

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
                externalUrl: data.externalUrl,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
                likes: data.likes || [],
                comments: data.comments || []
            } as Announcement;
        });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return [];
    }
};

export const getPaginatedAnnouncements = async (
    limitCount = 10,
    lastVisible: any = null
): Promise<{ data: Announcement[]; lastDoc: any }> => {
    try {
        let q = query(
            collection(db, COLLECTION_NAME),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );

        if (lastVisible) {
            const { startAfter } = await import("firebase/firestore");
            q = query(
                collection(db, COLLECTION_NAME),
                orderBy("createdAt", "desc"),
                startAfter(lastVisible),
                limit(limitCount)
            );
        }

        const querySnapshot = await getDocs(q);
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

        const data = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                content: data.content,
                date: data.date,
                type: data.type,
                priority: data.priority,
                externalUrl: data.externalUrl,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
                likes: data.likes || [],
                comments: data.comments || []
            } as Announcement;
        });

        return { data, lastDoc };
    } catch (error) {
        console.error("Error fetching paginated announcements:", error);
        return { data: [], lastDoc: null };
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
export const toggleLikeAnnouncement = async (announcementId: string, userId: string, isLiked: boolean): Promise<boolean> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, announcementId);
        await updateDoc(docRef, {
            likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
        });
        return true;
    } catch (error) {
        console.error("Error toggling like:", error);
        return false;
    }
};

export const addCommentToAnnouncement = async (announcementId: string, comment: Omit<Comment, "id">): Promise<Comment | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, announcementId);
        const newComment: Comment = {
            ...comment,
            id: Math.random().toString(36).substr(2, 9) // Simple ID generation for comments
        };
        await updateDoc(docRef, {
            comments: arrayUnion(newComment)
        });
        return newComment;
    } catch (error) {
        console.error("Error adding comment:", error);
        return null;
    }
};

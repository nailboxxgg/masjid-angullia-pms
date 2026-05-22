
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
    QueryDocumentSnapshot,
    DocumentData
} from "firebase/firestore";
import { Announcement, Comment } from "./types";

const COLLECTION_NAME = "announcements";
const MEMBER_COLLECTION_NAME = "member_announcements";

const mapAnnouncement = (docSnapshot: QueryDocumentSnapshot<DocumentData>, audience: Announcement["audience"]): Announcement => {
    const data = docSnapshot.data();
    return {
        id: docSnapshot.id,
        title: data.title,
        content: data.content,
        date: data.date,
        type: data.type,
        priority: data.priority,
        audience,
        externalUrl: data.externalUrl,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (typeof data.createdAt === "number" ? data.createdAt : Date.now()),
        likes: data.likes || [],
        comments: data.comments || []
    } as Announcement;
};

export const getAnnouncements = async (limitCount = 10, includeMemberOnly = false): Promise<Announcement[]> => {
    try {
        const publicQuery = query(
            collection(db, COLLECTION_NAME),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
        const publicSnapshotPromise = getDocs(publicQuery);
        const memberSnapshotPromise = includeMemberOnly
            ? getDocs(query(collection(db, MEMBER_COLLECTION_NAME), orderBy("createdAt", "desc"), limit(limitCount)))
            : Promise.resolve(null);

        const [publicSnapshot, memberSnapshot] = await Promise.all([publicSnapshotPromise, memberSnapshotPromise]);
        const publicAnnouncements = publicSnapshot.docs.map(doc => mapAnnouncement(doc, "public"));
        const memberAnnouncements = memberSnapshot?.docs.map(doc => mapAnnouncement(doc, "members")) || [];

        return [...publicAnnouncements, ...memberAnnouncements]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limitCount);
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return [];
    }
};

export const getPaginatedAnnouncements = async (
    limitCount = 10,
    lastVisible: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<{ data: Announcement[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
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

        const data = querySnapshot.docs.map(doc => mapAnnouncement(doc, "public"));

        return { data, lastDoc };
    } catch (error) {
        console.error("Error fetching paginated announcements:", error);
        return { data: [], lastDoc: null };
    }
};

export const createAnnouncement = async (announcement: Omit<Announcement, "id" | "createdAt">): Promise<string | null> => {
    try {
        const { audience = "public", ...announcementFields } = announcement;
        // Remove undefined fields to prevent Firestore addDoc errors
        const sanitizedData = Object.fromEntries(
            Object.entries(announcementFields).filter(([, value]) => value !== undefined)
        );
        const collectionName = audience === "members" ? MEMBER_COLLECTION_NAME : COLLECTION_NAME;

        const docRef = await addDoc(collection(db, collectionName), {
            ...sanitizedData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating announcement:", error);
        return null;
    }
};

export const deleteAnnouncement = async (id: string, audience: Announcement["audience"] = "public"): Promise<boolean> => {
    try {
        const collectionName = audience === "members" ? MEMBER_COLLECTION_NAME : COLLECTION_NAME;
        await deleteDoc(doc(db, collectionName, id));
        return true;
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return false;
    }
};
export const toggleLikeAnnouncement = async (
    announcementId: string,
    userId: string,
    isLiked: boolean,
    audience: Announcement["audience"] = "public"
): Promise<boolean> => {
    try {
        const collectionName = audience === "members" ? MEMBER_COLLECTION_NAME : COLLECTION_NAME;
        const docRef = doc(db, collectionName, announcementId);
        await updateDoc(docRef, {
            likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
        });
        return true;
    } catch (error) {
        console.error("Error toggling like:", error);
        return false;
    }
};

export const addCommentToAnnouncement = async (
    announcementId: string,
    comment: Omit<Comment, "id">,
    audience: Announcement["audience"] = "public"
): Promise<Comment | null> => {
    try {
        const collectionName = audience === "members" ? MEMBER_COLLECTION_NAME : COLLECTION_NAME;
        const docRef = doc(db, collectionName, announcementId);
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

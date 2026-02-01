
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where } from "firebase/firestore";

export type FeedbackType = 'Concern' | 'Feedback' | 'Request';

export interface FeedbackData {
    id?: string;
    name: string;
    email: string;
    contactNumber: string;
    type: FeedbackType;
    message: string;
    status: 'New' | 'Read' | 'Resolved';
    createdAt: any;
}

const COLLECTION_NAME = "feedback";

export const submitFeedback = async (data: Omit<FeedbackData, 'id' | 'status' | 'createdAt'>) => {
    try {
        await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            status: 'New',
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return { success: false, error };
    }
};

export const getFeedbacks = async (): Promise<FeedbackData[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as FeedbackData));
    } catch (error) {
        console.error("Error fetching feedbacks:", error);
        return [];
    }
};

export const getFeedbacksByType = async (type: FeedbackType): Promise<FeedbackData[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("type", "==", type),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as FeedbackData));
    } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        return [];
    }
};

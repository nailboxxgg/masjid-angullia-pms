import { db } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    Timestamp,
    where,
    doc,
    deleteDoc,
    updateDoc
} from "firebase/firestore";
import { Family } from "./types";

const COLLECTION_NAME = "families";

export const getFamilies = async (limitCount = 100): Promise<Family[]> => {
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
                name: data.name,
                head: data.head,
                members: data.members,
                phone: data.phone,
                address: data.address,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : new Date().getTime()
            } as Family;
        });
    } catch (error) {
        console.error("Error fetching families:", error);
        return [];
    }
};

export const addFamily = async (family: Omit<Family, "id">) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...family,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding family:", error);
        return null;
    }
};

export const countFamilies = async (): Promise<number> => {
    // Prototype: count client side. In prod use aggregation query
    const families = await getFamilies(1000);
    return families.length;
};

export const updateFamily = async (id: string, data: Partial<Family>) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...data,
            // updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error("Error updating family:", error);
        return false;
    }
};

export const deleteFamily = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return true;
    } catch (error) {
        console.error("Error deleting family:", error);
        return false;
    }
};


import { db } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    Timestamp,
    DocumentData,
    deleteDoc,
    doc
} from "firebase/firestore";
import { Donation } from "./types";

const COLLECTION_NAME = "donations";

export const getDonations = async (limitCount = 50): Promise<Donation[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy("date", "desc"),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                amount: data.amount,
                donorName: data.donorName,
                type: data.type,
                date: data.date instanceof Timestamp ? data.date.toMillis() : new Date(data.date).getTime(),
                email: data.email,
                isAnonymous: data.isAnonymous,
                message: data.message, // Intended use or dedication
                status: data.status || 'completed'
            } as Donation;
        });
    } catch (error) {
        console.error("Error fetching donations:", error);
        return [];
    }
};

export const addDonation = async (donation: Omit<Donation, "id">) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...donation,
            date: Timestamp.fromMillis(donation.date),
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding donation:", error);
        return null;
    }
};

export const deleteDonation = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return true;
    } catch (error) {
        console.error("Error deleting donation:", error);
        return false;
    }
};

export const getTotalDonations = async (): Promise<number> => {
    // In a real app, use aggregation queries or a cloud function counter
    // For now, client-side sum (prototype)
    const donations = await getDonations(100);
    return donations.reduce((sum, d) => sum + d.amount, 0);
};

export interface DonationStats {
    totalCollected: number;
    monthlyCollected: number;
    breakdown: Record<string, number>;
    recentDonations: Donation[];
}

export const getDonationStats = async (): Promise<DonationStats> => {
    try {
        // Fetch all donations (or a large limit for now) for aggregation
        // In production, use Firestore Aggregation Queries
        const donations = await getDonations(500);

        const totalCollected = donations.reduce((sum, d) => sum + d.amount, 0);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyCollected = donations
            .filter(d => {
                const date = new Date(d.date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum, d) => sum + d.amount, 0);

        const breakdown: Record<string, number> = {};
        donations.forEach(d => {
            const type = d.type || 'Other';
            breakdown[type] = (breakdown[type] || 0) + d.amount;
        });

        return {
            totalCollected,
            monthlyCollected,
            breakdown,
            recentDonations: donations.slice(0, 10)
        };
    } catch (error) {
        console.error("Error fetching stats:", error);
        return {
            totalCollected: 0,
            monthlyCollected: 0,
            breakdown: {},
            recentDonations: []
        };
    }
};

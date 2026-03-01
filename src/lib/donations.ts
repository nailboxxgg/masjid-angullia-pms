
import { db } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    Timestamp,
    deleteDoc,
    doc,
    setDoc,
    serverTimestamp,
    getDoc,
    getAggregateFromServer,
    sum,
    where
} from "firebase/firestore";
import { Donation } from "./types";

const COLLECTION_NAME = "donations";

// Helper to map legacy types to new types
const mapDonationType = (type: string): Donation['type'] => {
    switch (type) {
        case 'Zakat': return 'Community Welfare';
        case 'Sadaqah': return 'General Donation';
        default: return type as Donation['type'];
    }
};

export const getDonations = async (limitCount = 50): Promise<Donation[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy("date", "desc"),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map((docSnapshot) => {
            const data = docSnapshot.data();
            return {
                id: docSnapshot.id,
                amount: data.amount,
                donorName: data.donorName,
                type: mapDonationType(data.type),
                date: data.date instanceof Timestamp ? data.date.toMillis() : new Date(data.date).getTime(),
                isAnonymous: data.isAnonymous,
                message: data.message,
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
        // 1. Create the main document
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

export const updateDonationStatus = async (id: string, status: Donation['status']) => {
    try {
        await setDoc(doc(db, COLLECTION_NAME, id), { status }, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating donation status:", error);
        return false;
    }
};

export const getTotalDonations = async (): Promise<number> => {
    try {
        const snapshot = await getAggregateFromServer(collection(db, COLLECTION_NAME), {
            totalAmount: sum('amount')
        });
        return snapshot.data().totalAmount || 0;
    } catch (error) {
        console.error("Error getting total donations:", error);
        return 0;
    }
};

export interface DonationStats {
    totalCollected: number;
    monthlyCollected: number;
    breakdown: Record<string, number>;
    recentDonations: Donation[];
}

export const getDonationStats = async (): Promise<DonationStats> => {
    try {
        // Fetch recent donations for the list
        const recentDonations = await getDonations(10);

        const collectionRef = collection(db, COLLECTION_NAME);

        // 1. Total Collected
        const totalPromise = getAggregateFromServer(collectionRef, {
            totalAmount: sum('amount')
        });

        // 2. Monthly Collected
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

        const monthlyQuery = query(collectionRef, where("date", ">=", startOfMonthTimestamp));
        const monthlyPromise = getAggregateFromServer(monthlyQuery, {
            monthlyAmount: sum('amount')
        });

        // 3. Breakdown by known types
        const breakdownTypes = [
            'Mosque Operations', 'Islamic Education', 'Education', 'Community Meals',
            'Community Welfare', 'Zakat', 'General Donation', 'Sadaqah',
            'Construction', 'General', 'Other'
        ];

        const breakdownPromises = breakdownTypes.map(async (t) => {
            const q = query(collectionRef, where("type", "==", t));
            const snap = await getAggregateFromServer(q, { total: sum('amount') });
            return { type: t, amount: snap.data().total || 0 };
        });

        const [totalSnap, monthlySnap, ...breakdownResults] = await Promise.all([
            totalPromise,
            monthlyPromise,
            ...breakdownPromises
        ]);

        const totalCollected = totalSnap.data().totalAmount || 0;
        const monthlyCollected = monthlySnap.data().monthlyAmount || 0;

        const breakdown: Record<string, number> = {};
        breakdownResults.forEach((result) => {
            if (result.amount > 0) {
                const mappedType = mapDonationType(result.type);
                breakdown[mappedType] = (breakdown[mappedType] || 0) + result.amount;
            }
        });

        return {
            totalCollected,
            monthlyCollected,
            breakdown,
            recentDonations
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

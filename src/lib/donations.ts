
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
    doc,
    setDoc,
    serverTimestamp,
    getDoc
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

export const getDonations = async (limitCount = 50, includePrivateInfo = false): Promise<Donation[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy("date", "desc"),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);

        const donationPromises = querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            const donation: Donation = {
                id: docSnapshot.id,
                amount: data.amount,
                donorName: data.donorName,
                type: mapDonationType(data.type),
                date: data.date instanceof Timestamp ? data.date.toMillis() : new Date(data.date).getTime(),
                email: data.email, // Legacy email if still in main doc
                isAnonymous: data.isAnonymous,
                message: data.message,
                status: data.status || 'completed'
            };

            // Fetch private info if requested and not already in main document
            if (includePrivateInfo && !donation.email) {
                try {
                    const privateInfo = await getDonationPrivateInfo(docSnapshot.id);
                    if (privateInfo?.email) {
                        donation.email = privateInfo.email;
                    }
                } catch (e) {
                    // Silently ignore permission errors for private info
                    console.log("Could not fetch private info for donation:", docSnapshot.id);
                }
            }

            return donation;
        });

        return Promise.all(donationPromises);
    } catch (error) {
        console.error("Error fetching donations:", error);
        return [];
    }
};

export const addDonation = async (donation: Omit<Donation, "id">) => {
    try {
        const { email, ...publicData } = donation;

        // 1. Create the main document (publicly readable except for restricted fields)
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...publicData,
            date: Timestamp.fromMillis(donation.date),
            createdAt: Timestamp.now()
        });

        // 2. Save sensitive email to a private sub-collection
        if (email) {
            await setDoc(doc(db, COLLECTION_NAME, docRef.id, "private", "info"), {
                email,
                updatedAt: serverTimestamp()
            });
        }

        return docRef.id;
    } catch (error) {
        console.error("Error adding donation:", error);
        return null;
    }
};

/**
 * Fetch sensitive donor information (Admins only via rules)
 */
export const getDonationPrivateInfo = async (donationId: string): Promise<{ email?: string } | null> => {
    try {
        const docSnap = await getDoc(doc(db, COLLECTION_NAME, donationId, "private", "info"));
        if (docSnap.exists()) {
            return docSnap.data() as { email?: string };
        }
        return null;
    } catch (error) {
        console.error("Error fetching private donation info:", error);
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
        // Fetch recent donations for the list
        const recentDonations = await getDonations(10, true);

        // Fetch larger set for stats aggregation
        // TODO: Replace with Firestore Aggregation Queries in production to avoid high read costs
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy("date", "desc"),
            limit(500)
        );
        const querySnapshot = await getDocs(q);
        const allDonations = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                type: mapDonationType(data.type),
                date: data.date instanceof Timestamp ? data.date.toMillis() : new Date(data.date).getTime(),
            } as Donation;
        });

        const totalCollected = allDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyCollected = allDonations
            .filter(d => {
                const date = new Date(d.date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum, d) => sum + (d.amount || 0), 0);

        const breakdown: Record<string, number> = {};
        allDonations.forEach(d => {
            const type = d.type || 'Other';
            breakdown[type] = (breakdown[type] || 0) + d.amount;
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

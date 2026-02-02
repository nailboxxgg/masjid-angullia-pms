
import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

export interface Subscriber {
    id: string;
    phoneNumber: string;
    createdAt: number;
}

export const subscribeToNotifications = async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    // Basic validation
    if (!phoneNumber.startsWith("09") || phoneNumber.length !== 11) {
        return { success: false, message: "Please enter a valid PH mobile number (09xxxxxxxxx)" };
    }

    try {
        // Check for duplicates
        const q = query(collection(db, "subscribers"), where("phoneNumber", "==", phoneNumber));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, message: "This number is already subscribed!" };
        }

        // Add to Firestore
        await addDoc(collection(db, "subscribers"), {
            phoneNumber,
            createdAt: serverTimestamp()
        });

        console.log("New Subscriber Added:", phoneNumber);
        return { success: true, message: "Successfully subscribed to SMS updates!" };

    } catch (error) {
        console.error("Subscription error:", error);
        return { success: false, message: "Failed to subscribe. Please try again later." };
    }
};



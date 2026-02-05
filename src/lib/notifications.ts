
import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

export interface Subscriber {
    id: string;
    phoneNumber: string;
    createdAt: number;
}

export const subscribeToNotifications = async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    // Validation: Support +639xxxxxxxxx (13 chars) or 09xxxxxxxxx (11 chars)
    const phRegex = /^(09|\+639)\d{9}$/;

    if (!phRegex.test(phoneNumber)) {
        return { success: false, message: "Please enter a valid PH mobile number (e.g., 09xx... or +639xx...)" };
    }

    try {
        // Check for duplicates (Check both 09... and +63... formats)
        // Normalize: If we have +639123456789, we should also check if 09123456789 exists
        let checkFormats = [phoneNumber];

        if (phoneNumber.startsWith("+63")) {
            checkFormats.push("0" + phoneNumber.substring(3));
        } else if (phoneNumber.startsWith("0")) {
            checkFormats.push("+63" + phoneNumber.substring(1));
        }

        const q = query(collection(db, "subscribers"), where("phoneNumber", "in", checkFormats));
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




"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { getSMSProvider } from "@/lib/sms";

export async function broadcastSMSAction(message: string) {
    try {
        if (!message) {
            return { success: false, error: "Message is required" };
        }

        // 1. Fetch Subscribers
        const subscribersRef = collection(db, "subscribers");
        const snapshot = await getDocs(query(subscribersRef));

        if (snapshot.empty) {
            return { success: true, count: 0, message: "No subscribers found." };
        }

        const phoneNumbers = snapshot.docs.map(doc => doc.data().phoneNumber as string);

        // 2. Initialize Provider
        const smsProvider = getSMSProvider();

        // 3. Send Messages
        let successCount = 0;
        const results = await Promise.all(
            phoneNumbers.map(async (phone) => {
                const sent = await smsProvider.send(phone, message);
                if (sent) successCount++;
                return sent;
            })
        );

        return {
            success: true,
            provider: smsProvider.name,
            total: phoneNumbers.length,
            sent: successCount,
            results
        };

    } catch (error) {
        console.error("Broadcast Action Error:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

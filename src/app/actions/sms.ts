
"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { getSMSProvider } from "@/lib/sms";

type SMSBroadcastResult =
    | { success: true; sent: number; total: number; results: any[]; message?: string; provider?: string }
    | { success: false; error: string };

export async function broadcastSMSAction(message: string, clientPhoneNumbers?: string[]): Promise<SMSBroadcastResult> {
    try {
        if (!message) {
            return { success: false, error: "Message is required" };
        }

        let phoneNumbers: string[] = [];

        // 1. Use provided numbers or Fetch Subscribers
        if (clientPhoneNumbers && clientPhoneNumbers.length > 0) {
            phoneNumbers = clientPhoneNumbers;
        } else {
            // Fallback: Try to fetch (might fail on server without admin SDK if rules are strict)
            const subscribersRef = collection(db, "subscribers");
            const snapshot = await getDocs(query(subscribersRef));
            if (!snapshot.empty) {
                phoneNumbers = snapshot.docs.map(doc => doc.data().phoneNumber as string);
            }
        }

        if (phoneNumbers.length === 0) {
            return { success: true, sent: 0, total: 0, results: [], message: "No subscribers found." };
        }

        // 2. Initialize Provider
        const smsProvider = getSMSProvider();

        // 3. Send Messages
        let successCount = 0;
        const results = await Promise.all(
            phoneNumbers.map(async (phone) => {
                const result = await smsProvider.send(phone, message);
                if (result.success) successCount++;
                return { phone, ...result };
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

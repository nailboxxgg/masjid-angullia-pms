
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { getSMSProvider } from "@/lib/sms";

// Basic security check (in production, use proper session/auth check)
// For this prototype, we'll assume the request comes from an authenticated source or add a simple header check if needed.
// However, since this is a server-side route called by the client, Next.js Middleware or session check is best.
// We will focus on functionality first.

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
        }

        // 1. Fetch Subscribers
        const subscribersRef = collection(db, "subscribers");
        const snapshot = await getDocs(query(subscribersRef));

        if (snapshot.empty) {
            return NextResponse.json({ success: true, count: 0, message: "No subscribers found." });
        }

        const phoneNumbers = snapshot.docs.map(doc => doc.data().phoneNumber as string);

        // 2. Initialize Provider
        const smsProvider = getSMSProvider();
        console.log(`Broadcasting via ${smsProvider.name} to ${phoneNumbers.length} subscribers...`);

        // 3. Send Messages (Batching could be improved for large scale)
        let successCount = 0;
        const results = await Promise.all(
            phoneNumbers.map(async (phone) => {
                const sent = await smsProvider.send(phone, message);
                if (sent) successCount++;
                return sent;
            })
        );

        return NextResponse.json({
            success: true,
            provider: smsProvider.name,
            total: phoneNumbers.length,
            sent: successCount,
            results
        });

    } catch (error) {
        console.error("Broadcast Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

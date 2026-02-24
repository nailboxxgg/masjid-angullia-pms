
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { getSMSProvider } from "@/lib/sms";


export async function POST(request: Request) {
    try {
        // Basic security check: Verify Authorization header
        const authHeader = request.headers.get("Authorization");
        const adminSecret = process.env.ADMIN_SECRET;

        if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
        }

        // 1. Fetch Subscribers
        const subscribersRef = collection(db, "subscribers");
        const snapshot = await getDocs(query(subscribersRef));

        if (snapshot.empty) {
            return NextResponse.json({ success: true, sent: 0, total: 0, results: [], message: "No subscribers found." });
        }

        const phoneNumbers = snapshot.docs.map(doc => doc.data().phoneNumber as string);

        // 2. Initialize Provider
        const smsProvider = getSMSProvider();
        console.log(`Broadcasting via ${smsProvider.name} to ${phoneNumbers.length} subscribers...`);

        // 3. Send Messages (Batching could be improved for large scale)
        let successCount = 0;
        const results = await Promise.all(
            phoneNumbers.map(async (phone) => {
                const result = await smsProvider.send(phone, message);
                if (result.success) successCount++;
                return { phone, ...result };
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

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
        }

        // Normalize phone number: trim whitespace
        const normalizedPhone = phone.trim();

        // 1. Check staff collection
        const staffSnapshot = await adminDb
            .collection("staff")
            .where("phoneNumber", "==", normalizedPhone)
            .limit(1)
            .get();

        if (!staffSnapshot.empty) {
            const email = staffSnapshot.docs[0].data().email;
            if (email) return NextResponse.json({ email });
        }

        // 2. Check users collection
        const usersSnapshot = await adminDb
            .collection("users")
            .where("phone", "==", normalizedPhone)
            .limit(1)
            .get();

        if (!usersSnapshot.empty) {
            const email = usersSnapshot.docs[0].data().email;
            if (email) return NextResponse.json({ email });
        }

        // 3. Check families collection (legacy fallback)
        const familiesSnapshot = await adminDb
            .collection("families")
            .where("phone", "==", normalizedPhone)
            .limit(1)
            .get();

        if (!familiesSnapshot.empty) {
            const email = familiesSnapshot.docs[0].data().email;
            if (email) return NextResponse.json({ email });
        }

        return NextResponse.json({ error: "No account found with this phone number." }, { status: 404 });
    } catch (error) {
        console.error("Secure phone resolution failed:", error);
        return NextResponse.json({ error: "An internal error occurred during phone number resolution." }, { status: 500 });
    }
}

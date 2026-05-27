import { NextRequest, NextResponse } from "next/server";
import { admin, adminAuth, adminDb } from "@/lib/firebase-admin";
import { MemberProfile } from "@/lib/types";

const defaultNotificationPreferences: MemberProfile["notificationPreferences"] = {
    announcements: true,
    events: true,
    donations: true,
    prayerTimes: true,
};

const getBearerToken = (request: NextRequest) => {
    const header = request.headers.get("authorization") || "";
    const [scheme, token] = header.split(" ");
    return scheme?.toLowerCase() === "bearer" ? token : "";
};

export async function POST(request: NextRequest) {
    try {
        const token = getBearerToken(request);

        if (!token) {
            return NextResponse.json({ error: "Missing authentication token." }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifyIdToken(token);
        const body = await request.json() as Partial<MemberProfile>;
        const displayName = body.displayName?.trim();
        const email = body.email?.trim().toLowerCase() || decodedToken.email?.toLowerCase();

        if (!displayName || !email) {
            return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
        }

        if (email !== decodedToken.email?.toLowerCase()) {
            return NextResponse.json({ error: "Email does not match the authenticated account." }, { status: 403 });
        }

        const profile = {
            uid: decodedToken.uid,
            displayName,
            email,
            phone: body.phone || "",
            address: body.address || "",
            familyId: body.familyId || "",
            familyName: body.familyName || "",
            membershipStatus: "pending",
            statusReason: "",
            statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            notificationPreferences: {
                ...defaultNotificationPreferences,
                ...(body.notificationPreferences || {}),
            },
            role: "member",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await adminDb.collection("users").doc(decodedToken.uid).set(profile, { merge: true });

        return NextResponse.json({ id: decodedToken.uid, role: "member" });
    } catch (error) {
        console.error("Member registration failed:", error);
        return NextResponse.json({ error: "Unable to save member profile." }, { status: 500 });
    }
}

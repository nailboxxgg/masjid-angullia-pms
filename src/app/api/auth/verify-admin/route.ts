import { NextRequest, NextResponse } from "next/server";
import { admin, adminAuth, adminDb } from "@/lib/firebase-admin";

const getBearerToken = (request: NextRequest) => {
    const header = request.headers.get("authorization") || "";
    const [scheme, token] = header.split(" ");
    return scheme?.toLowerCase() === "bearer" ? token : "";
};

export async function POST(request: NextRequest) {
    try {
        const token = getBearerToken(request);

        if (!token) {
            return NextResponse.json({ error: "Missing authentication token.", code: "missing_token" }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;
        const email = decodedToken.email?.toLowerCase();

        let staffSnapshot = await adminDb.collection("staff").doc(uid).get();

        if (!staffSnapshot.exists && email) {
            const legacySnapshot = await adminDb
                .collection("staff")
                .where("email", "==", email)
                .limit(1)
                .get();

            if (!legacySnapshot.empty) {
                const legacyDoc = legacySnapshot.docs[0];
                const staffData = legacyDoc.data();
                const uidRef = adminDb.collection("staff").doc(uid);

                await uidRef.set({
                    ...staffData,
                    uid,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });

                if (legacyDoc.id === email) {
                    await legacyDoc.ref.delete();
                }

                staffSnapshot = await uidRef.get();
            }
        }

        if (!staffSnapshot.exists) {
            return NextResponse.json({ error: "No staff account was found for this login.", code: "no_staff" }, { status: 403 });
        }

        const staff = staffSnapshot.data() || {};

        if (staff.role !== "admin") {
            return NextResponse.json({ error: "This staff account is not authorized for the admin portal.", code: "not_admin" }, { status: 403 });
        }

        if (staff.status && staff.status !== "active") {
            return NextResponse.json({ error: "This admin account is inactive.", code: "inactive_admin" }, { status: 403 });
        }

        return NextResponse.json({
            role: "admin",
            staffId: staffSnapshot.id,
            name: staff.name || decodedToken.name || "",
            email: staff.email || email || "",
        });
    } catch (error) {
        console.error("Admin verification failed:", error);
        return NextResponse.json({ error: "Unable to verify admin account.", code: "verify_failed" }, { status: 500 });
    }
}

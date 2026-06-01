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

        console.log("[VERIFY-ADMIN API] Request received:", { uid, email });

        let staffSnapshot = await adminDb.collection("staff").doc(uid).get();
        console.log("[VERIFY-ADMIN API] Existing staff document in Firestore:", { exists: staffSnapshot.exists, data: staffSnapshot.exists ? staffSnapshot.data() : null });

        const seedEmail = process.env.NEXT_PUBLIC_ADMIN_SEED_EMAIL?.trim().toLowerCase();
        console.log("[VERIFY-ADMIN API] Seed email check:", { seedEmail, emailMatches: email === seedEmail });

        if (!staffSnapshot.exists && email && seedEmail && email === seedEmail) {
            console.log("[VERIFY-ADMIN API] Seeding admin staff user...");
            const uidRef = adminDb.collection("staff").doc(uid);
            await uidRef.set({
                uid,
                email,
                name: decodedToken.name || email.split("@")[0],
                role: "admin",
                status: "active",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            staffSnapshot = await uidRef.get();
            console.log("[VERIFY-ADMIN API] Seed complete. Doc exists now:", staffSnapshot.exists);
        }

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

                await adminDb.runTransaction(async (transaction) => {
                    transaction.set(uidRef, {
                        ...staffData,
                        uid,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });

                    if (legacyDoc.id === email) {
                        transaction.delete(legacyDoc.ref);
                    }
                });

                staffSnapshot = await uidRef.get();
            }
        }

        if (!staffSnapshot.exists) {
            console.log("[VERIFY-ADMIN API] Denied: No staff account exists.");
            return NextResponse.json({ error: "No staff account was found for this login.", code: "no_staff" }, { status: 403 });
        }

        const staff = staffSnapshot.data() || {};
        console.log("[VERIFY-ADMIN API] Loaded staff record:", staff);

        if (staff.role !== "admin") {
            console.log("[VERIFY-ADMIN API] Denied: role is not admin:", staff.role);
            return NextResponse.json({ error: "This staff account is not authorized for the admin portal.", code: "not_admin" }, { status: 403 });
        }

        if (staff.status && staff.status !== "active") {
            console.log("[VERIFY-ADMIN API] Denied: status is not active:", staff.status);
            return NextResponse.json({ error: "This admin account is inactive.", code: "inactive_admin" }, { status: 403 });
        }

        console.log("[VERIFY-ADMIN API] Approved admin login!");
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

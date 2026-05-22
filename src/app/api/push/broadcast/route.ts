import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, url = "/" } = await request.json();

  const snapshot = await adminDb.collection("push_tokens").get();
  const tokens = snapshot.docs.map((doc) => doc.data().token).filter(Boolean);

  if (tokens.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const response = await adminMessaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body,
    },
    data: {
      url,
    },
    webpush: {
      fcmOptions: {
        link: url,
      },
    },
  });

  return NextResponse.json({
    total: tokens.length,
    sent: response.successCount,
    failed: response.failureCount,
  });
}
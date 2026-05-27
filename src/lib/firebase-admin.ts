import admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // Fallback/Mock initialization during build time (e.g. CI / GitHub Actions) to prevent crash
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "mock-project-id",
        clientEmail: "mock-client-email@mock.iam.gserviceaccount.com",
        privateKey: "-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n",
      }),
    });
  }
}

export const adminMessaging = admin.messaging();
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export { admin };

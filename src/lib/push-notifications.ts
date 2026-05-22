"use client";

import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import app, { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function requestPushNotifications(userId?: string) {
  const supported = await isSupported();

  if (!supported) {
    throw new Error("Push notifications are not supported on this browser.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Unable to get notification token.");
  }

  await setDoc(
    doc(db, "push_tokens", token),
    {
      token,
      userId: userId || null,
      platform: "android-pwa",
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return token;
}

export async function listenForForegroundMessages(
  callback: (payload: unknown) => void
) {
  const supported = await isSupported();
  if (!supported) return () => {};

  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}
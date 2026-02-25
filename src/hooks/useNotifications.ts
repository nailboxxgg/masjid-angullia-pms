"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateFeedbackStatus, FeedbackData } from "@/lib/feedback";

export interface Notification {
    id: string;
    type: "Concern" | "Feedback" | "Request" | "Message";
    senderName: string;
    preview: string;
    createdAt: number;
    status: "New" | "Read" | "Resolved";
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, "feedback"),
            where("status", "==", "New"),
            orderBy("createdAt", "desc"),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Notification[] = snapshot.docs.map((doc) => {
                const data = doc.data() as FeedbackData;
                return {
                    id: doc.id,
                    type: data.type as Notification["type"],
                    senderName: data.name || "Anonymous",
                    preview: data.message?.slice(0, 80) || "",
                    createdAt: data.createdAt,
                    status: data.status,
                };
            });
            setNotifications(items);
        }, (error) => {
            console.error("Notification listener error:", error);
        });

        return () => unsubscribe();
    }, []);

    const unreadCount = notifications.length;

    const markAsRead = async (id: string) => {
        await updateFeedbackStatus(id, "Read");
    };

    const markAllRead = async () => {
        await Promise.all(notifications.map((n) => updateFeedbackStatus(n.id, "Read")));
    };

    return { notifications, unreadCount, markAsRead, markAllRead };
}

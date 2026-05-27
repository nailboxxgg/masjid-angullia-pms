import { MemberNotification, MemberNotificationType } from "./types";
import {
    createMemberNotificationServer,
    getMemberNotificationsServer,
    markMemberNotificationReadServer,
    markAllMemberNotificationsReadServer,
} from "@/app/actions/notifications";

export interface CreateNotificationInput {
    memberId: string;
    type: MemberNotificationType;
    title: string;
    body: string;
    link?: string;
}

export const createMemberNotification = async (input: CreateNotificationInput): Promise<string | null> => {
    return createMemberNotificationServer(input);
};

export const getMemberNotifications = async (memberId: string, max = 100): Promise<MemberNotification[]> => {
    return getMemberNotificationsServer(memberId, max);
};

export const markMemberNotificationRead = async (notificationId: string) => {
    await markMemberNotificationReadServer(notificationId);
};

export const markAllMemberNotificationsRead = async (memberId: string, notifications: MemberNotification[]) => {
    await markAllMemberNotificationsReadServer(memberId, notifications);
};

export const countUnreadNotifications = (notifications: MemberNotification[]): number =>
    notifications.reduce((count, notification) => (notification.read ? count : count + 1), 0);

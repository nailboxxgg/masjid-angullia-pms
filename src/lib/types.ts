export interface Donation {
    id: string;
    amount: number;
    donorName: string; // 'Anonymous' if isAnonymous is true
    type: 'Community Welfare' | 'General Donation' | 'Construction' | 'Education' | 'Other' | 'General';
    date: number; // timestamp
    status: 'pending' | 'completed' | 'failed';
    paymentMethod?: 'gcash' | 'paymaya' | 'grab_pay' | 'bank_transfer' | 'qr_ph';
    referenceNumber?: string;
    isAnonymous: boolean; // Replaces isHidden
    message?: string; // Intended use or dedication
    memberId?: string;
    donorEmail?: string;
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: number;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string; // ISO string or display string
    type: 'General' | 'Event' | 'Urgent' | 'Fundraising';
    priority: 'low' | 'normal' | 'high';
    audience?: 'public' | 'members';
    externalUrl?: string;
    imageUrl?: string;
    createdAt: number;
    likes?: string[]; // Array of user UIDs
    comments?: Comment[];
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    registrationOpen: boolean;
    registrantsCount: number;
    imageUrl?: string;
    capacity?: number;
    category?: string;
    createdAt?: number;
    membersOnly?: boolean;
    memberReservedSlots?: number;
    memberEarlyAccessUntil?: string; // ISO datetime; before this, only members can register
    volunteerPositionsAvailable?: boolean;
}

export interface FamilyMember {
    id: string;
    name: string;
    relation: string;
    isDeceased?: boolean;
}

export interface Family {
    id: string;
    name: string;
    head: string;
    members: FamilyMember[] | number; // allow number for backward compatibility
    phone: string;
    email?: string;
    address: string;
    createdAt?: number;
    preferences?: {
        newRequestAlerts?: boolean;
        dailyDonationSummary?: boolean;
    };
    status?: 'active' | 'pending';
}

export interface MemberProfile {
    id: string;
    uid: string;
    displayName: string;
    email: string;
    phone?: string;
    address?: string;
    familyId?: string;
    familyName?: string;
    membershipStatus: 'active' | 'pending' | 'suspended';
    statusReason?: string;
    statusUpdatedAt?: number;
    statusUpdatedBy?: string;
    notificationPreferences: {
        announcements: boolean;
        events: boolean;
        donations: boolean;
        prayerTimes: boolean;
    };
    donationPreferences?: {
        defaultFund?: string;
        defaultIsAnonymous?: boolean;
        name?: string;
        email?: string;
        phone?: string;
    };
    createdAt: number;
    updatedAt?: number;
}

export interface VolunteerRegistration {
    id: string;
    eventId: string;
    memberId: string;
    memberName: string;
    memberEmail: string;
    notes?: string;
    status: 'registered' | 'checked_in' | 'completed' | 'cancelled';
    createdAt: number;
    updatedAt?: number;
}

export interface MemberServiceRequest {
    id: string;
    memberId: string;
    memberName: string;
    memberEmail: string;
    type: 'General Inquiry' | 'Religious Service' | 'Welfare Support' | 'Family Link';
    subject: string;
    message: string;
    status: 'pending' | 'in_review' | 'resolved' | 'cancelled';
    adminReply?: string;
    repliedAt?: number;
    createdAt: number;
    updatedAt?: number;
}

export interface Staff {
    id: string; // The specific ID used for login (e.g., "S-1234")
    name: string;
    role: 'admin' | 'staff';
    department?: string;
    contactNumber: string;
    address?: string;
    email?: string;
    createdAt: number;
    status: 'active' | 'inactive';
}

export interface AttendanceRecord {
    id: string;
    staffId?: string; // Link to Staff ID
    uid?: string; // Keep for backward compatibility
    displayName: string;
    email?: string;
    type: 'clock_in' | 'clock_out' | 'visitor';
    role?: 'admin' | 'staff' | 'volunteer';
    phone?: string;
    timestamp: number;
    date: string; // YYYY-MM-DD
    deviceInfo?: string;
}

export interface AttendanceSession {
    id: string;
    staffId?: string;
    uid?: string;
    displayName: string;
    email?: string;
    type?: 'staff_session' | 'visitor_log';
    role?: 'admin' | 'staff' | 'volunteer';
    phone?: string;
    date: string;
    clockIn: number;
    clockOut?: number;
    deviceInfo?: string;
    status: 'active' | 'completed' | 'visitor';
    duration?: string;
}

export interface Registrant {
    id: string;
    eventId: string;
    name: string;
    email: string;
    contactNumber: string;
    createdAt: number;
    status: 'pending' | 'accepted' | 'attended' | 'rejected';
    memberId?: string;
}

export type MemberNotificationType =
    | 'event_registration'
    | 'event_reminder'
    | 'request_update'
    | 'request_reply'
    | 'announcement'
    | 'membership_status'
    | 'system';

export interface MemberNotification {
    id: string;
    memberId: string;
    type: MemberNotificationType;
    title: string;
    body: string;
    link?: string;
    read: boolean;
    createdAt: number;
}

export interface EventAttendance {
    id: string;
    eventId: string;
    uid?: string; // Optional if manual entry without account
    name: string;
    status: 'present';
    timestamp: number;
    recordedBy: string; // Admin UID
    isWalkIn?: boolean;
}

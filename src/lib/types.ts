export interface Donation {
    id: string;
    amount: number;
    donorName: string; // 'Anonymous' if isAnonymous is true
    contactNumber?: string;
    email?: string;
    type: 'Zakat' | 'Sadaqah' | 'Construction' | 'Education' | 'Other' | 'General';
    date: number; // timestamp
    status: 'pending' | 'completed' | 'failed';
    paymentMethod?: 'gcash' | 'paymaya' | 'grab_pay' | 'bank_transfer' | 'qr_ph';
    referenceNumber?: string;
    isAnonymous: boolean; // Replaces isHidden
    message?: string; // Intended use or dedication
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string; // ISO string or display string
    type: 'General' | 'Event' | 'Urgent' | 'Fundraising';
    priority: 'low' | 'normal' | 'high';
    imageUrl?: string;
    externalUrl?: string;
    createdAt: number;
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
}

export interface AttendanceRecord {
    id: string;
    uid: string;
    displayName: string;
    email: string;
    type: 'clock_in' | 'clock_out' | 'visitor';
    role?: 'volunteer' | 'staff' | 'admin';
    phone?: string; // for visitors
    timestamp: number;
    date: string; // YYYY-MM-DD for easier querying
    deviceInfo?: string;
}

export interface AttendanceSession {
    id: string; // composite id: uid_timestamp
    uid: string;
    displayName: string;
    email: string;
    type?: 'staff_session' | 'visitor_log';
    role?: string;
    phone?: string;
    date: string;
    clockIn: number;
    clockOut?: number;
    deviceInfo?: string;
    status: 'active' | 'completed' | 'visitor';
    duration?: string; // e.g. "8h 30m"
}

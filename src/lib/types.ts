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

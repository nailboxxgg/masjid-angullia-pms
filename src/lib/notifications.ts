
export interface Subscriber {
    id: string;
    phoneNumber: string;
    createdAt: number;
}

// Mock Subscribers Storage (In-memory for prototype)
let subscribers: Subscriber[] = [];

export const subscribeToNotifications = async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!phoneNumber.startsWith("09") || phoneNumber.length !== 11) {
        return { success: false, message: "Please enter a valid PH mobile number (09xxxxxxxxx)" };
    }

    if (subscribers.find(s => s.phoneNumber === phoneNumber)) {
        return { success: false, message: "This number is already subscribed!" };
    }

    subscribers.push({
        id: Math.random().toString(36).substring(7),
        phoneNumber,
        createdAt: Date.now()
    });

    console.log("New Subscriber:", phoneNumber);
    return { success: true, message: "Successfully subscribed to SMS updates!" };
};

export const sendMockSMS = async (message: string): Promise<boolean> => {
    console.log(`[MOCK SMS GATEWAY] Broadcasting to ${subscribers.length} numbers: "${message}"`);
    return true;
};

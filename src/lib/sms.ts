
export interface SMSProvider {
    send(to: string, message: string): Promise<boolean>;
    name: string;
}

export class SemaphoreProvider implements SMSProvider {
    name = "Semaphore";
    private apiKey: string;
    private senderName: string;

    constructor(apiKey: string, senderName: string = "SEMAPHORE") {
        this.apiKey = apiKey;
        this.senderName = senderName;
    }

    async send(to: string, message: string): Promise<boolean> {
        try {
            const response = await fetch("https://api.semaphore.co/api/v4/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    apikey: this.apiKey,
                    number: to,
                    message: message,
                    sendername: this.senderName,
                }),
            });

            const data = await response.json();
            console.log("Semaphore Response:", data);

            // Semaphore returns an array of messages sent or an object with status
            return Array.isArray(data) && data.length > 0;
        } catch (error) {
            console.error("Semaphore Send Error:", error);
            return false;
        }
    }
}


export class InfobipProvider implements SMSProvider {
    name = "Infobip";
    private apiKey: string;
    private baseUrl: string;
    private senderName: string;

    constructor(apiKey: string, baseUrl: string, senderName: string = "InfoSMS") {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash if present
        this.senderName = senderName;
    }

    async send(to: string, message: string): Promise<boolean> {
        try {
            // Ensure number has international format (Infobip requires it)
            // Assuming PH +63 if starts with 0
            const formattedTo = to.startsWith("0") ? `63${to.substring(1)}` : to;

            const response = await fetch(`${this.baseUrl}/sms/2/text/advanced`, {
                method: "POST",
                headers: {
                    "Authorization": `App ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    messages: [
                        {
                            destinations: [{ to: formattedTo }],
                            from: this.senderName,
                            text: message
                        }
                    ]
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Infobip API Error (${response.status}):`, errorText);
                return false;
            }

            const data = await response.json();
            console.log("Infobip Response:", JSON.stringify(data));

            // Check for successful message status
            if (data.messages && data.messages.length > 0) {
                const msgStatus = data.messages[0].status;
                console.log(`Infobip Delivery Status: ${msgStatus.name} - ${msgStatus.description}`);

                // basic check: if rejected/failed
                if (msgStatus.groupId === 5 || msgStatus.name.includes("REJECTED")) {
                    console.error("Msg Rejected:", msgStatus.description);
                    return false;
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error("Infobip Send Error:", error);
            return false;
        }
    }
}

export class TwilioProvider implements SMSProvider {
    name = "Twilio";
    private accountSid: string;
    private authToken: string;
    private messagingServiceSid?: string;
    private fromNumber?: string;

    constructor(accountSid: string, authToken: string, options: { messagingServiceSid?: string, fromNumber?: string }) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.messagingServiceSid = options.messagingServiceSid;
        this.fromNumber = options.fromNumber;
    }

    async send(to: string, message: string): Promise<boolean> {
        try {
            const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
            const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

            const body: Record<string, string> = {
                To: to,
                Body: message,
            };

            if (this.messagingServiceSid) {
                body.MessagingServiceSid = this.messagingServiceSid;
            } else if (this.fromNumber) {
                body.From = this.fromNumber;
            } else {
                console.error("Twilio Error: Neither MessagingServiceSid nor From number provided");
                return false;
            }

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams(body),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(`Twilio API Error (${response.status}):`, data);
                return false;
            }

            console.log("Twilio Response:", data.sid);
            return true;
        } catch (error) {
            console.error("Twilio Send Error:", error);
            return false;
        }
    }
}

export class MockProvider implements SMSProvider {
    name = "Mock";

    async send(to: string, message: string): Promise<boolean> {
        console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        return true;
    }
}

// Factory to get provider based on env
export const getSMSProvider = (): SMSProvider => {
    const providerName = process.env.SMS_PROVIDER || "mock";

    if (providerName.toLowerCase() === "semaphore") {
        const apiKey = process.env.SEMAPHORE_API_KEY;
        if (!apiKey) {
            console.warn("SEMAPHORE_API_KEY missing, falling back to Mock");
            return new MockProvider();
        }
        return new SemaphoreProvider(apiKey);
    }

    if (providerName.toLowerCase() === "infobip") {
        const apiKey = process.env.INFOBIP_API_KEY;
        const baseUrl = process.env.INFOBIP_BASE_URL;

        if (!apiKey || !baseUrl) {
            console.warn("INFOBIP credentials missing (API Key or Base URL), falling back to Mock");
            return new MockProvider();
        }

        const senderName = process.env.INFOBIP_SENDER_NAME || "InfoSMS";
        return new InfobipProvider(apiKey, baseUrl, senderName);
    }

    if (providerName.toLowerCase() === "twilio") {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
            console.warn("TWILIO credentials missing (Account SID, Auth Token, or Messaging Service SID/Phone Number), falling back to Mock");
            return new MockProvider();
        }

        return new TwilioProvider(accountSid, authToken, { messagingServiceSid, fromNumber });
    }

    return new MockProvider();
};

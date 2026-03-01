
export interface SMSProvider {
    send(to: string, message: string): Promise<{ success: boolean; error?: string }>;
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

    async send(to: string, message: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch("https://api.semaphore.co/api/v4/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    apikey: this.apiKey,
                    // Semaphore typically expects 09xxxxxxxxx or 639xxxxxxxxx. 
                    // Let's ensure it's in a compatible format.
                    // If it starts with +63, replace with 0.
                    number: to.startsWith("+63") ? "0" + to.substring(3) : to,
                    message: message,
                    sendername: this.senderName,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Semaphore API Error (${response.status}):`, errorText);
                return { success: false, error: `API Error ${response.status}: ${errorText.substring(0, 100)}` };
            }

            let data;
            try {
                data = await response.json();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_e) {
                const text = await response.text();
                console.error("Semaphore JSON Parse Error:", text);
                return { success: false, error: "Invalid JSON response from Semaphore" };
            }

            console.log("Semaphore Response:", data);

            // Semaphore returns an array of messages sent or an object with status
            if (Array.isArray(data) && data.length > 0) {
                return { success: true };
            } else {
                return { success: false, error: JSON.stringify(data) };
            }
        } catch (error) {
            console.error("Semaphore Send Error:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }
}


export class InfobipProvider implements SMSProvider {
    name = "Infobip";
    private apiKey: string;
    private baseUrl: string;
    private senderName: string;

    constructor(apiKey: string, baseUrl: string, senderName: string = "InfoSMS") {
        this.apiKey = apiKey.trim();
        // Ensure baseUrl has https:// prefix if missing and no trailing slash
        let url = baseUrl.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        this.baseUrl = url.replace(/\/$/, "");
        this.senderName = senderName;
    }

    async send(to: string, message: string): Promise<{ success: boolean; error?: string }> {
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
                return { success: false, error: `API Error ${response.status}: ${errorText}` };
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
                    return { success: false, error: `Rejected: ${msgStatus.description}` };
                }
                return { success: true };
            }
            return { success: false, error: "No message status returned" };
        } catch (error) {
            console.error("Infobip Send Error:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
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

    async send(to: string, message: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Twilio requires E.164 format (+CountryCodeNumber).
            // Logic: If it starts with '0', assume PH (63) and add '+'.
            // If it starts with '63', add '+'.
            // If it's already '+', leave as is.
            let formattedTo = to.trim();
            if (formattedTo.startsWith("0")) {
                formattedTo = "+63" + formattedTo.substring(1);
            } else if (formattedTo.startsWith("63")) {
                formattedTo = "+" + formattedTo;
            } else if (!formattedTo.startsWith("+")) {
                // Default fallback: add + if missing, assuming it's already international without prefix
                formattedTo = "+" + formattedTo;
            }

            const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
            const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

            const body: Record<string, string> = {
                To: formattedTo,
                Body: message,
            };

            if (this.messagingServiceSid) {
                body.MessagingServiceSid = this.messagingServiceSid;
            } else if (this.fromNumber) {
                body.From = this.fromNumber;
            } else {
                console.error("Twilio Error: Neither MessagingServiceSid nor From number provided");
                return { success: false, error: "Configuration Error: Missing parameters" };
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
                const errorCode = data.code ? `[Error ${data.code}] ` : "";
                const errorMessage = data.message || response.statusText;
                console.error(`Twilio API Error (${response.status}):`, data);
                return { success: false, error: `Twilio: ${errorCode}${errorMessage}` };
            }

            console.log("Twilio Response:", data.sid);
            return { success: true };
        } catch (error) {
            console.error("Twilio Send Error:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }
}

export class SMSPHProvider implements SMSProvider {
    name = "SMSPH";
    private apiKey: string;
    private apiUrl = "https://sms-api-ph.netlify.app/send/sms";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async send(to: string, message: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Format number to +63 format as per docs (e.g., 09123456789 -> +639123456789)
            const formattedRecipient = to.startsWith("0") ? "+63" + to.substring(1) : (to.startsWith("+63") ? to : "+63" + to);

            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "x-api-key": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    recipient: formattedRecipient,
                    message: message,
                }),
                signal: AbortSignal.timeout(8000), // 8 second timeout
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`SMSPH API Error (${response.status}):`, errorText);
                return { success: false, error: `API Error ${response.status}: ${errorText.substring(0, 100)}` };
            }

            let data;
            try {
                data = await response.json();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_e) {
                // If JSON fails, it might be a text response or HTML error
                const text = await response.text();
                return { success: false, error: `Invalid Response: ${text.substring(0, 50)}...` };
            }

            console.log("SMSPH Response:", data);

            return { success: data && data.success === true, error: data?.error };
        } catch (error) {
            console.error("SMSPH Send Error:", error);
            if (error instanceof Error && error.name === 'AbortError') {
                return { success: false, error: "Connection Timeout: SMS Provider took too long to respond." };
            }
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }
}

export class PromoTexterProvider implements SMSProvider {
    name = "PromoTexter";
    private senderId: string;
    private clientId: string;
    private passkey: string;
    private url: string;
    private dlrCall: string;

    constructor(options: { senderId: string, clientId: string, passkey: string, url?: string, dlrCall?: string }) {
        this.senderId = options.senderId;
        this.clientId = options.clientId;
        this.passkey = options.passkey;
        this.url = options.url || "http://promotexter.com/index.php/api/send_sms";
        this.dlrCall = options.dlrCall || "";
    }

    async send(to: string, message: string): Promise<{ success: boolean; error?: string }> {
        try {
            const query = new URLSearchParams({
                senderid: this.senderId,
                clientid: this.clientId,
                passkey: this.passkey,
                msisdn: to,
                message: Buffer.from(message).toString('base64'),
                'dlr-call': this.dlrCall,
                'dlr-callback': '',
            });

            const response = await fetch(`${this.url}?${query.toString()}`, {
                method: "GET",
                signal: AbortSignal.timeout(10000),
            });

            const result = await response.text();
            // Based on PHP library: if result is numeric and > 0, it's success (202)
            const isSuccess = parseInt(result) > 0;

            if (isSuccess) {
                return { success: true };
            } else {
                return { success: false, error: `PromoTexter Error: ${result}` };
            }
        } catch (error) {
            console.error("PromoTexter Send Error:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }
}

export class RisingTideProvider implements SMSProvider {
    name = "RisingTide";
    private clientId: string;
    private clientPassword: string;
    private from: string;
    private usageType: string;
    private url: string;

    constructor(options: { clientId: string, clientPassword: string, from: string, usageType: string, url: string }) {
        this.clientId = options.clientId;
        this.clientPassword = options.clientPassword;
        this.from = options.from;
        this.usageType = options.usageType;
        this.url = options.url;
    }

    async send(to: string, message: string): Promise<{ success: boolean; error?: string }> {
        try {
            const messageId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const date = new Date();
            // Format: YYYY-MM-DDTHH:mm:ss+0800
            const timestamp = date.toISOString().split('.')[0] + "+0800";

            const body = {
                id: messageId,
                from: this.from,
                to: to,
                content_type: "text/plain",
                body: message,
                usagetype: this.usageType,
                date: timestamp,
                delivery_receipt_url: '',
            };

            const signature = Buffer.from(`${this.clientId}:${this.clientPassword}`).toString('base64');

            const response = await fetch(this.url, {
                method: "POST",
                headers: {
                    'Authorization': `Basic ${signature}`,
                    'Accept': 'application/vnd.net.wyrls.Document-v3+json',
                    'Date': date.toUTCString(),
                    'Content-Type': 'application/vnd.net.wyrls.Document-v3+json',
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(10000),
            });

            if (response.ok) {
                return { success: true };
            } else {
                const errorText = await response.text();
                return { success: false, error: `RisingTide Error (${response.status}): ${errorText}` };
            }
        } catch (error) {
            console.error("RisingTide Send Error:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }
}

export class AndroidGatewayProvider implements SMSProvider {
    name = "AndroidGateway";
    private gatewayUrl: string;

    constructor(gatewayUrl: string) {
        // Ensure trailing slash is removed if present
        this.gatewayUrl = gatewayUrl.endsWith('/') ? gatewayUrl.slice(0, -1) : gatewayUrl;
    }

    async send(to: string, message: string): Promise<{ success: boolean; error?: string }> {
        try {
            const url = `${this.gatewayUrl}/send-sms`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    phone: to,
                    message: message,
                }),
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Android Gateway Error (${response.status}):`, errorText);
                return { success: false, error: `Gateway Error ${response.status}: ${errorText}` };
            }

            const data = await response.json();
            console.log("Android Gateway Response:", data);

            return { success: true };
        } catch (error) {
            console.error("Android Gateway Send Error:", error);
            if (error instanceof Error && error.name === 'AbortError') {
                return { success: false, error: "Connection Timeout: Phone took too long to respond. Is it on the same network?" };
            }
            return { success: false, error: error instanceof Error ? error.message : "Network error" };
        }
    }
}

export class MockProvider implements SMSProvider {
    name = "Mock";

    async send(to: string, message: string): Promise<{ success: boolean; error?: string }> {
        console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        return { success: true };
    }
}

// Factory to get provider based on env
export const getSMSProvider = (): SMSProvider => {
    let providerName = (process.env.SMS_PROVIDER || "mock").toLowerCase();

    // Randomization logic
    if (providerName === "random") {
        const weightsStr = process.env.SMS_WEIGHTS; // e.g., '{"semaphore":0.5, "promotexter":0.5}'
        if (weightsStr) {
            try {
                const weights = JSON.parse(weightsStr) as Record<string, number>;
                const providers = Object.keys(weights);
                const random = Math.random();
                let cumulative = 0;
                for (const p of providers) {
                    cumulative += weights[p];
                    if (random < cumulative) {
                        providerName = p.toLowerCase();
                        break;
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_e) {
                console.error("Error parsing SMS_WEIGHTS, defaulting to first configured provider or mock");
            }
        }
    }

    if (providerName === "android") {
        const gatewayUrl = process.env.ANDROID_GATEWAY_URL;

        if (!gatewayUrl) {
            console.warn("ANDROID_GATEWAY_URL missing in environment variables, falling back to Mock");
            return new MockProvider();
        }

        return new AndroidGatewayProvider(gatewayUrl);
    }

    if (providerName === "semaphore") {
        const apiKey = process.env.SEMAPHORE_API_KEY;
        if (!apiKey) {
            console.warn("SEMAPHORE_API_KEY missing, falling back to Mock");
            return new MockProvider();
        }
        return new SemaphoreProvider(apiKey);
    }

    if (providerName === "infobip") {
        const apiKey = process.env.INFOBIP_API_KEY;
        const baseUrl = process.env.INFOBIP_BASE_URL;

        if (!apiKey || !baseUrl) {
            console.warn("INFOBIP credentials missing (API Key or Base URL), falling back to Mock");
            return new MockProvider();
        }

        const senderName = process.env.INFOBIP_SENDER_NAME || "InfoSMS";
        return new InfobipProvider(apiKey, baseUrl, senderName);
    }

    if (providerName === "twilio") {
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

    if (providerName === "smsph") {
        const apiKey = process.env.SMSPH_API_KEY;

        if (!apiKey) {
            console.warn("SMSPH_API_KEY missing, falling back to Mock");
            return new MockProvider();
        }

        return new SMSPHProvider(apiKey);
    }

    if (providerName === "promotexter") {
        const senderId = process.env.PROMOTEXTER_SENDER_ID;
        const clientId = process.env.PROMOTEXTER_CLIENT_ID;
        const passkey = process.env.PROMOTEXTER_PASSKEY;

        if (!senderId || !clientId || !passkey) {
            console.warn("PROMOTEXTER credentials missing, falling back to Mock");
            return new MockProvider();
        }

        return new PromoTexterProvider({
            senderId,
            clientId,
            passkey,
            url: process.env.PROMOTEXTER_URL,
            dlrCall: process.env.PROMOTEXTER_DLR_CALL
        });
    }

    if (providerName === "risingtide") {
        const clientId = process.env.RISINGTIDE_CLIENT_ID;
        const clientPassword = process.env.RISINGTIDE_CLIENT_PASSWORD;
        const from = process.env.RISINGTIDE_FROM;
        const usageType = process.env.RISINGTIDE_USAGE_TYPE;
        const url = process.env.RISINGTIDE_URL;

        if (!clientId || !clientPassword || !from || !usageType || !url) {
            console.warn("RISINGTIDE credentials missing, falling back to Mock");
            return new MockProvider();
        }

        return new RisingTideProvider({ clientId, clientPassword, from, usageType, url });
    }

    return new MockProvider();
};

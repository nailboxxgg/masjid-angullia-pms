export interface PayMongoSource {
    id: string;
    type: string;
    attributes: {
        amount: number;
        billing: {
            address: {
                city: string;
                country: string;
                line1: string;
                line2: string;
                postal_code: string;
                state: string;
            };
            email: string;
            name: string;
            phone: string;
        };
        currency: string;
        livemode: boolean;
        redirect: {
            checkout_url: string;
            failed: string;
            success: string;
        };
        status: string;
        type: "gcash" | "grab_pay" | "paymaya";
        created_at: number;
        updated_at: number;
    };
}

export const createSource = async (amount: number, type: "gcash" | "paymaya" | "grab_pay") => {
    // Mocked API call for PayMongo Source
    // Real implementation would fetch('https://api.paymongo.com/v1/sources', options)

    console.log(`Creating PayMongo Source: ${type} - ${amount}`);

    // Return mock response for UI testing
    return {
        data: {
            id: `src_${Math.random().toString(36).substr(2, 9)}`,
            type: "source",
            attributes: {
                amount: amount * 100, // PayMongo uses centavos
                redirect: {
                    checkout_url: "https://test-sources.paymongo.com/sources?id=test",
                    success: "http://localhost:3000/donations/success",
                    failed: "http://localhost:3000/donations/failed"
                },
                status: "pending",
                type: type
            }
        }
    };
};

export const createPaymentIntent = async (amount: number, description: string) => {
    // For Credit Card / BPI / BDO (which often use PaymentIntents API)
    console.log(`Creating Payment Intent: ${amount} - ${description}`);
    return {
        data: {
            id: `pi_${Math.random().toString(36).substr(2, 9)}`,
            attributes: {
                amount: amount * 100,
                client_key: "pi_client_key_test",
                status: "awaiting_payment_method"
            }
        }
    }
}

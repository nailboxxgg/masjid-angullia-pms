"use server";

import { QRPhTransaction } from "@/lib/instapay";
import { getDonationStats } from "@/lib/donations";

export async function generatePaymentQR(amount: number, _description: string): Promise<QRPhTransaction> {
    // Simulate server-side processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Logic moved from client mocked service to server
    // In production, this is where you would call:
    // await fetch('https://api.paymongo.com/v1/sources', { 
    //   headers: { Authorization: `Basic ${process.env.PAYMONGO_SECRET_KEY}` } 
    // })

    const referenceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mockQRString = `https://portal-management-system.com/pay/${referenceNumber}`;
    // Using a public QR generator for visual mock, but hiding the generation logic URL construction if desired. 
    // Ideally, the payment gateway returns the URL directly.
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockQRString)}&color=0f172a`;

    console.log(`[Server] Generated QR for ${amount}: ${referenceNumber}`);

    return {
        referenceNumber,
        qrCodeUrl,
        amount,
        status: 'pending',
        expiresAt: Date.now() + 1000 * 60 * 15 // 15 minutes expiry
    };
}

export async function verifyPaymentStatus(referenceNumber: string): Promise<'pending' | 'completed' | 'failed'> {
    // Simulate server-side verification with gateway
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`[Server] Verifying payment: ${referenceNumber}`);

    // Always return completed for mock
    return 'completed';
}

export async function getDonationStatsAction() {
    // Move the potentially sensitive calculation to the server
    return await getDonationStats();
}

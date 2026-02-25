// Mock service for QR PH generation logic

export interface QRPhTransaction {
    referenceNumber: string;
    qrCodeUrl: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    expiresAt: number;
}

export const generateQRPh = async (amount: number, _description: string): Promise<QRPhTransaction> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const referenceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Using a public QR code generator API for the mock visual
    // In a real app, this would be the string returned by the payment gateway (e.g. Xendit, PayMongo, UnionBank)
    const mockQRString = `https://portal-management-system.com/pay/${referenceNumber}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockQRString)}&color=0f172a`;

    return {
        referenceNumber,
        qrCodeUrl,
        amount,
        status: 'pending',
        expiresAt: Date.now() + 1000 * 60 * 15 // 15 minutes expiry
    };
};

export const checkPaymentStatus = async (_referenceNumber: string): Promise<'pending' | 'completed' | 'failed'> => {
    // Simulate network check
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo purposes, we will assume it's always successful if checked
    // In a real app, this would query the gateway API
    return 'completed';
}

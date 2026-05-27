import { User, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export interface VerifiedAdminSession {
    user: User;
    role: "admin";
}

export interface AdminVerificationResult {
    role: "admin";
    staffId: string;
    name?: string;
    email?: string;
}

export class AdminVerificationError extends Error {
    code?: string;

    constructor(message: string, code?: string) {
        super(message);
        this.name = "AdminVerificationError";
        this.code = code;
    }
}

export const verifyCurrentAdminAccount = async (user: User): Promise<AdminVerificationResult> => {
    const token = await user.getIdToken(true);
    const response = await fetch("/api/auth/verify-admin", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    const data = await response.json().catch(() => null) as { error?: string; code?: string } | AdminVerificationResult | null;

    if (!response.ok) {
        const errorData = data as { error?: string; code?: string } | null;
        throw new AdminVerificationError(
            errorData?.error || "Unable to verify admin account.",
            errorData?.code
        );
    }

    return data as AdminVerificationResult;
};

export const authenticateAdminAccount = async (email: string, password: string): Promise<VerifiedAdminSession> => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    try {
        await verifyCurrentAdminAccount(user);
    } catch (error) {
        await auth.signOut();
        throw error;
    }

    return { user, role: "admin" };
};

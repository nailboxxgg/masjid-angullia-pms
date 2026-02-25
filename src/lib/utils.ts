import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatTimeAgo(date: string | number | Date) {
    if (!date) return "";
    const d = new Date(date);
    const now = typeof window !== 'undefined' ? Date.now() : d.getTime(); // Match on server to avoid 'Just now' mismatch
    const seconds = Math.floor((now - d.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/**
 * Normalizes an 11-digit PH phone number (starting with 0) to +63 format
 */
export function normalizePhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 11) {
        return `+63${digits.substring(1)}`;
    }
    return phone;
}

/**
 * Validates if a string is a valid 11-digit PH phone number starting with 09
 */
export function isValidPHPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return /^09\d{9}$/.test(digits);
}

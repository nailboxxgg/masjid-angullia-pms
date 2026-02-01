"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface RequestFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    className?: string;
}

export default function RequestForm({ onSuccess, onCancel, className }: RequestFormProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLoading(false);
        if (onSuccess) onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Requester Name</label>
                    <input
                        required
                        type="text"
                        placeholder="Your Full Name"
                        className="flex h-10 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Phone / Contact</label>
                    <input
                        required
                        type="text"
                        placeholder="Mobile Number"
                        className="flex h-10 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Request Type</label>
                    <select className="flex h-10 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option>Financial Assistance (Zakat)</option>
                        <option>Marriage Certificate</option>
                        <option>Facility Booking</option>
                        <option>Counseling / Advice</option>
                        <option>Funeral Services</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Subject</label>
                    <input
                        required
                        type="text"
                        placeholder="Brief title of your request"
                        className="flex h-10 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Description</label>
                    <textarea
                        required
                        rows={4}
                        placeholder="Please describe your request in detail..."
                        className="flex w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="flex items-center space-x-2 text-sm text-secondary-700">
                        <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                        <span>This request is private/confidential.</span>
                    </label>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 text-sm font-medium"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700 text-sm font-medium flex items-center justify-center min-w-[120px]"
                >
                    {loading ? "Submitting..." : "Submit Request"}
                </button>
            </div>
        </form>
    );
}

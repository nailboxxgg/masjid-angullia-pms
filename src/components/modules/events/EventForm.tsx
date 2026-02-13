"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

interface EventFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    className?: string; // Add className prop for better flexibility
}

export default function EventForm({ onSuccess, onCancel, className }: EventFormProps) {
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
        <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Event Title</label>
                    <input
                        required
                        type="text"
                        placeholder="e.g. Annual Iftar Gathering"
                        className="flex h-11 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Start Date & Time</label>
                    <input
                        required
                        type="datetime-local"
                        className="flex h-11 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-700">End Date & Time</label>
                    <input
                        type="datetime-local"
                        className="flex h-11 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                    />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Location</label>
                    <input
                        type="text"
                        placeholder="e.g. Main Prayer Hall or External Venue"
                        className="flex h-11 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                    />
                </div>

                <div className="col-span-1 space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Type</label>
                    <select className="flex h-11 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base">
                        <option>Religious</option>
                        <option>Community</option>
                        <option>Educational</option>
                        <option>Fundraising</option>
                    </select>
                </div>

                <div className="col-span-1 space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Max Capacity</label>
                    <input
                        type="number"
                        placeholder="e.g. 200"
                        className="flex h-11 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                    />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-secondary-700">Description</label>
                    <textarea
                        rows={4}
                        className="flex w-full rounded-md border border-secondary-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                        placeholder="Event details..."
                    />
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
                    className="px-4 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700 text-sm font-medium flex items-center justify-center min-w-[100px]"
                >
                    {loading ? "Creating..." : "Create Event"}
                </button>
            </div>
        </form>
    );
}

"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface FamilyFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function FamilyForm({ onSuccess, onCancel }: FamilyFormProps) {
    const [loading, setLoading] = useState(false);
    // Placeholder state - normally connected to React Hook Form + Zod
    const [members, setMembers] = useState([{ id: 1, name: "", relation: "Head" }]);

    const addMember = () => {
        setMembers([...members, { id: Date.now(), name: "", relation: "Member" }]);
    };

    const removeMember = (id: number) => {
        setMembers(members.filter((m) => m.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLoading(false);
        if (onSuccess) onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-secondary-900 border-b pb-2">Family Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">Family Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Ali Family"
                            className="flex h-10 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">Head of Family</label>
                        <input
                            required
                            type="text"
                            placeholder="Full Name"
                            className="flex h-10 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">Phone</label>
                        <input
                            type="tel"
                            placeholder="+63 9XX XXX XXXX"
                            className="flex h-10 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">Email</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            className="flex h-10 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-secondary-700">Address</label>
                        <textarea
                            placeholder="Complete Address"
                            className="flex min-h-[80px] w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-sm font-medium text-secondary-900">Family Members</h4>
                    <button
                        type="button"
                        onClick={addMember}
                        className="inline-flex items-center text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add Member
                    </button>
                </div>

                <div className="space-y-3">
                    {members.map((member) => (
                        <div key={member.id} className="flex gap-3 items-end p-3 bg-secondary-50 rounded-lg border border-secondary-100">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs text-secondary-500">Full Name</label>
                                <input
                                    type="text"
                                    className="flex h-9 w-full rounded border border-secondary-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    placeholder="Member Name"
                                />
                            </div>
                            <div className="w-1/3 space-y-1">
                                <label className="text-xs text-secondary-500">Relationship</label>
                                <select className="flex h-9 w-full rounded border border-secondary-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
                                    <option>Spouse</option>
                                    <option>Child</option>
                                    <option>Parent</option>
                                    <option>Sibling</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeMember(member.id)}
                                className="h-9 w-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
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
                    className="px-4 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700 text-sm font-medium flex items-center min-w-[100px] justify-center"
                >
                    {loading ? "Saving..." : "Save Family"}
                </button>
            </div>
        </form>
    );
}

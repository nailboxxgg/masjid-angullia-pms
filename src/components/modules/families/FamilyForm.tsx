"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addFamily, updateFamily } from "@/lib/families";
import { Family, FamilyMember } from "@/lib/types";
import { normalizePhoneNumber, isValidPHPhone } from "@/lib/utils";

interface FamilyFormProps {
    initialData?: Family | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function FamilyForm({ initialData, onSuccess, onCancel }: FamilyFormProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [head, setHead] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    const [members, setMembers] = useState<FamilyMember[]>([
        { id: "1", name: "", relation: "Spouse", isDeceased: false }
    ]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setHead(initialData.head || "");

            // If phone starts with +63, convert to 0 for UI
            let displayPhone = initialData.phone || "";
            if (displayPhone.startsWith("+63")) {
                displayPhone = "0" + displayPhone.substring(3);
            }
            setPhone(displayPhone);

            setEmail(initialData.email || "");
            setAddress(initialData.address || "");

            // Handle legacy data where members might be a number
            if (Array.isArray(initialData.members)) {
                setMembers(initialData.members);
            } else {
                // Legacy: initialData.members is a number (count)
                const count = typeof initialData.members === 'number' ? initialData.members : 0;
                const newMembers: FamilyMember[] = [];
                for (let i = 0; i < count; i++) {
                    newMembers.push({
                        id: Date.now().toString() + i, // simple mock id
                        name: "",
                        relation: "Child",
                        isDeceased: false
                    });
                }
                if (newMembers.length === 0) {
                    // Ensure at least one member exists if count was 0
                    newMembers.push({ id: Date.now().toString(), name: "", relation: "Spouse", isDeceased: false });
                }
                setMembers(newMembers);
            }
        }
    }, [initialData]);

    const addMember = () => {
        setMembers([...members, {
            id: Date.now().toString(),
            name: "",
            relation: "Child",
            isDeceased: false
        }]);
    };

    const removeMember = (id: string) => {
        setMembers(members.filter((m) => m.id !== id));
    };

    const updateMember = (id: string, field: keyof FamilyMember, value: FamilyMember[keyof FamilyMember]) => {
        setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Standard validation using utility
        if (!isValidPHPhone(phone)) {
            alert("Please enter a valid 11-digit mobile number starting with 09 (e.g., 09123456789)");
            return;
        }

        setLoading(true);

        const familyData: Omit<Family, "id"> = {
            name,
            head,
            phone: normalizePhoneNumber(phone),
            email,
            address,
            members: members // Save full array
        };

        let result;
        if (initialData) {
            result = await updateFamily(initialData.id, familyData);
        } else {
            result = await addFamily(familyData);
        }

        setLoading(false);
        if (result && onSuccess) {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
                <div className="bg-secondary-50/50 dark:bg-secondary-800/50 p-4 rounded-lg border border-secondary-100 dark:border-secondary-800 transition-colors">
                    <h4 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 uppercase tracking-wider mb-4">Family Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-secondary-800 dark:text-secondary-200">Family Name</label>
                            <input
                                required
                                type="text"
                                placeholder="Enter Family Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex h-11 w-full rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-4 py-2 placeholder:text-secondary-400 dark:placeholder:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800 dark:text-secondary-100 text-base"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-secondary-600 dark:text-secondary-400">Head of Family</label>
                            <input
                                required
                                type="text"
                                placeholder="Full Name"
                                value={head}
                                onChange={(e) => setHead(e.target.value)}
                                className="flex h-11 w-full rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-4 py-2 placeholder:text-secondary-400 dark:placeholder:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800 dark:text-secondary-100 text-base"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-secondary-600 dark:text-secondary-400">Phone</label>
                            <input
                                required
                                type="tel"
                                placeholder="09XXXXXXXXX"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                inputMode="numeric"
                                maxLength={11}
                                className="flex h-11 w-full rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-4 py-2 placeholder:text-secondary-400 dark:placeholder:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800 dark:text-secondary-100 text-base"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-secondary-600 dark:text-secondary-400">Email</label>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex h-11 w-full rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-2 placeholder:text-secondary-400 dark:placeholder:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800 dark:text-secondary-100 text-base"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                            <label className="text-xs font-medium text-secondary-600 dark:text-secondary-400">Address</label>
                            <textarea
                                placeholder="Complete Address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="flex min-h-[80px] w-full rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-2 placeholder:text-secondary-400 dark:placeholder:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none text-secondary-800 dark:text-secondary-100 text-base"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Family Members</h4>
                    <button
                        type="button"
                        onClick={addMember}
                        className="inline-flex items-center text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </button>
                </div>

                <div className="space-y-3">
                    {members.map((member) => (
                        <div key={member.id} className="flex gap-3 items-start p-3 bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-800 shadow-sm transition-colors">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-medium text-secondary-500 dark:text-secondary-400 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    className="flex h-10 w-full rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800 dark:text-secondary-100 text-base"
                                    placeholder="Family Member Name"
                                    value={member.name}
                                    onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                                />
                            </div>
                            <div className="w-1/3 space-y-1.5">
                                <label className="text-[10px] font-medium text-secondary-500 dark:text-secondary-400 uppercase">Relationship</label>
                                <div className="flex flex-col gap-2">
                                    <select
                                        value={member.relation}
                                        onChange={(e) => updateMember(member.id, 'relation', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800 dark:text-secondary-100 text-base"
                                    >
                                        <option className="text-secondary-800 dark:text-secondary-100">Spouse</option>
                                        <option className="text-secondary-800 dark:text-secondary-100">Child</option>
                                        <option className="text-secondary-800 dark:text-secondary-100">Parent</option>
                                        <option className="text-secondary-800 dark:text-secondary-100">Sibling</option>
                                        <option className="text-secondary-800 dark:text-secondary-100">Other</option>
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`deceased-${member.id}`}
                                            checked={member.isDeceased || false}
                                            onChange={(e) => updateMember(member.id, 'isDeceased', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 dark:border-secondary-700 text-primary-600 focus:ring-primary-500 bg-white dark:bg-secondary-800"
                                        />
                                        <label htmlFor={`deceased-${member.id}`} className="text-xs text-secondary-600 dark:text-secondary-400">Deceased</label>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6">
                                <button
                                    type="button"
                                    onClick={() => removeMember(member.id)}
                                    className="h-9 w-9 flex items-center justify-center text-secondary-400 dark:text-secondary-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100 dark:border-secondary-800 transition-colors">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100 text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-primary-600 dark:bg-primary-700 rounded-lg text-white hover:bg-primary-700 dark:hover:bg-primary-800 text-sm font-medium flex items-center shadow-sm shadow-primary-500/20 transition-all"
                >
                    {loading ? "Saving..." : "Save Family Information"}
                </button>
            </div>
        </form>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addFamily, updateFamily } from "@/lib/families";
import { Family, FamilyMember } from "@/lib/types";

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
        { id: "1", name: "", relation: "Head", isDeceased: false }
    ]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setHead(initialData.head || "");
            setPhone(initialData.phone || "");
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
                        relation: "Member",
                        isDeceased: false
                    });
                }
                if (newMembers.length === 0) {
                    // Ensure at least one member exists if count was 0
                    newMembers.push({ id: Date.now().toString(), name: "", relation: "Head", isDeceased: false });
                }
                setMembers(newMembers);
            }
        }
    }, [initialData]);

    const addMember = () => {
        setMembers([...members, {
            id: Date.now().toString(),
            name: "",
            relation: "Member",
            isDeceased: false
        }]);
    };

    const removeMember = (id: string) => {
        setMembers(members.filter((m) => m.id !== id));
    };

    const updateMember = (id: string, field: keyof FamilyMember, value: any) => {
        setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const familyData: Omit<Family, "id"> = {
            name,
            head,
            phone,
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
                <div className="bg-secondary-50/50 p-4 rounded-lg border border-secondary-100">
                    <h4 className="text-xl font-semibold text-secondary-800 uppercase tracking-wider mb-4">Family Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-secondary-800">Family Name</label>
                            <input
                                required
                                type="text"
                                placeholder="Enter Family Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-secondary-600">Head of Family</label>
                            <input
                                required
                                type="text"
                                placeholder="Full Name"
                                value={head}
                                onChange={(e) => setHead(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-secondary-600">Phone</label>
                            <input
                                type="tel"
                                placeholder="Enter Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-secondary-600">Email</label>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                            <label className="text-xs font-medium text-secondary-600">Address</label>
                            <textarea
                                placeholder="Complete Address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="flex min-h-[80px] w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none text-secondary-800"
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
                        className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-md hover:bg-primary-100 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </button>
                </div>

                <div className="space-y-3">
                    {members.map((member) => (
                        <div key={member.id} className="flex gap-3 items-start p-3 bg-white rounded-lg border border-secondary-200 shadow-sm">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-medium text-secondary-500 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-secondary-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800"
                                    placeholder="Family Member Name"
                                    value={member.name}
                                    onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                                />
                            </div>
                            <div className="w-1/3 space-y-1.5">
                                <label className="text-[10px] font-medium text-secondary-500 uppercase">Relationship</label>
                                <div className="flex flex-col gap-2">
                                    <select
                                        value={member.relation}
                                        onChange={(e) => updateMember(member.id, 'relation', e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-secondary-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-secondary-800"
                                    >
                                        <option>Head</option>
                                        <option>Spouse</option>
                                        <option>Child</option>
                                        <option>Parent</option>
                                        <option>Sibling</option>
                                        <option>Other</option>
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`deceased-${member.id}`}
                                            checked={member.isDeceased || false}
                                            onChange={(e) => updateMember(member.id, 'isDeceased', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <label htmlFor={`deceased-${member.id}`} className="text-xs text-secondary-600">Deceased</label>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6">
                                <button
                                    type="button"
                                    onClick={() => removeMember(member.id)}
                                    className="h-9 w-9 flex items-center justify-center text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-secondary-200 rounded-lg text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700 text-sm font-medium flex items-center shadow-sm shadow-primary-500/20 transition-all"
                >
                    {loading ? "Saving..." : "Save Family Information"}
                </button>
            </div>
        </form>
    );
}

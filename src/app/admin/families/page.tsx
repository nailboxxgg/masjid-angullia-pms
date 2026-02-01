"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import Modal from "@/components/ui/modal";
import FamilyForm from "@/components/modules/families/FamilyForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminFamiliesPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Placeholder data
    const families = [
        { id: 1, name: "Ali Family", head: "Mohammad Ali", members: 4, phone: "0917-123-4567", address: "Alaminos City" },
        { id: 2, name: "Rahman Family", head: "Abdul Rahman", members: 6, phone: "0918-987-6543", address: "Bani, Pangasinan" },
        { id: 3, name: "Hassan Family", head: "Yusuf Hassan", members: 3, phone: "0920-555-0123", address: "Sual, Pangasinan" },
    ];

    const filteredFamilies = families.filter(family =>
        family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        family.head.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">Family Registry</h1>
                    <p className="text-sm text-slate-500">Manage registered families and their members.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 shadow-sm transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" /> Register Family
                </button>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search families..."
                            className="w-full sm:w-80 pl-9 pr-4 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Family Name</th>
                                    <th className="px-6 py-3">Head of Family</th>
                                    <th className="px-6 py-3">Members</th>
                                    <th className="px-6 py-3">Contact</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredFamilies.map((family) => (
                                    <tr key={family.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{family.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{family.head}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {family.members} Members
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex flex-col text-xs">
                                                <span>{family.phone}</span>
                                                <span className="text-slate-400">{family.address}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="font-medium text-primary-600 hover:text-primary-800 hover:underline">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredFamilies.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            No families found matching specific search query.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Register New Family"
                className="max-w-2xl"
            >
                <FamilyForm
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        // In real app, trigger refresh
                    }}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>
        </div>
    );
}

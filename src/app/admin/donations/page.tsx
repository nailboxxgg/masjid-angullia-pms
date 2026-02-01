"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import Modal from "@/components/ui/modal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DonationForm from "@/components/modules/donations/DonationForm";

export default function AdminDonationsPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Placeholder data
    const donations = [
        { id: 1, donor: "Anonymous", amount: "$500.00", type: "General Fund", date: "2025-10-27", status: "Completed" },
        { id: 2, donor: "John Doe", amount: "$100.00", type: "Zakat", date: "2025-10-26", status: "Completed" },
        { id: 3, donor: "Jane Smith", amount: "$250.00", type: "Building Fund", date: "2025-10-25", status: "Pending" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-secondary-900 font-heading">Donations</h1>
                    <p className="text-sm text-secondary-500">Manage and track donations.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 shadow-sm transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" /> Record Donation
                </button>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-secondary-100">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
                        <input
                            type="text"
                            placeholder="Search donations..."
                            className="w-full sm:w-80 pl-9 pr-4 py-2 rounded-md border border-secondary-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary-50 text-secondary-600 font-medium border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-3">Donor</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {donations.map((donation) => (
                                    <tr key={donation.id} className="hover:bg-secondary-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-secondary-900">{donation.donor}</td>
                                        <td className="px-6 py-4">{donation.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-50 text-secondary-700">
                                                {donation.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-secondary-600">{donation.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${donation.status === "Completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                                }`}>
                                                {donation.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="font-medium text-primary-600 hover:text-primary-800 hover:underline">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Record Donation"
                className="max-w-2xl"
            >
                <DonationForm
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                    }}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>
        </div>
    );
}

"use client";

import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import Modal from "@/components/ui/modal";
import RequestForm from "@/components/modules/requests/RequestForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminRequestsPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Placeholder data
    const requests = [
        { id: 1, type: "Marriage Certificate", requestor: "Abdul Rahman", date: "Oct 24, 2025", status: "Pending", priority: "High" },
        { id: 2, type: "Financial Aid", requestor: "Siti Nurhaliza", date: "Oct 22, 2025", status: "In Progress", priority: "Medium" },
        { id: 3, type: "Venue Booking", requestor: "Youth Group", date: "Oct 20, 2025", status: "Approved", priority: "Low" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-secondary-900 font-heading">Service Requests</h1>
                    <p className="text-sm text-secondary-500">Manage community requests and applications.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white border border-secondary-200 text-secondary-700 hover:bg-secondary-50 h-10 px-4 shadow-sm transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Request
                </button>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-secondary-100">
                    <div className="flex items-center justify-between">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                className="w-full sm:w-80 pl-9 pr-4 py-2 rounded-md border border-secondary-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-secondary-600 hover:text-secondary-900 bg-secondary-50 rounded-md border border-secondary-200">
                            <Filter className="w-4 h-4" /> Filter
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary-50 text-secondary-600 font-medium border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-3">Request Type</th>
                                    <th className="px-6 py-3">Requestor</th>
                                    <th className="px-6 py-3">Date Submitted</th>
                                    <th className="px-6 py-3">Priority</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-secondary-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-secondary-900">{req.type}</td>
                                        <td className="px-6 py-4 text-secondary-600">{req.requestor}</td>
                                        <td className="px-6 py-4 text-secondary-500 text-xs">{req.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${req.priority === 'High' ? 'bg-red-50 text-red-600' :
                                                req.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {req.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                                                req.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-secondary-100 text-secondary-600'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="font-medium text-primary-600 hover:text-primary-800 hover:underline">Review</button>
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
                title="New Request"
                className="max-w-xl"
            >
                <RequestForm
                    onSuccess={() => setIsAddModalOpen(false)}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>
        </div>
    );
}

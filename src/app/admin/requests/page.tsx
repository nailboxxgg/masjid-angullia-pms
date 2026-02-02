"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Clock, Check, X, Trash2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getFeedbacksByType, FeedbackData, updateFeedbackStatus, deleteFeedback } from "@/lib/feedback";
import Modal from "@/components/ui/modal";

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<FeedbackData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedRequest, setSelectedRequest] = useState<FeedbackData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [statusFilter, setStatusFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getFeedbacksByType('Request');
        setRequests(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateStatus = async (id: string, status: 'Resolved' | 'New') => {
        const success = await updateFeedbackStatus(id, status);
        if (success) {
            loadData();
            if (selectedRequest && selectedRequest.id === id) {
                setSelectedRequest({ ...selectedRequest, status });
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this request?")) {
            const success = await deleteFeedback(id);
            if (success) {
                loadData();
                setIsModalOpen(false);
            }
        }
    };

    const openReview = (req: FeedbackData) => {
        setSelectedRequest(req);
        setIsModalOpen(true);
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-secondary-900 font-heading">Service Requests</h1>
                    <p className="text-sm text-secondary-500">Manage community requests and applications.</p>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-secondary-100">
                    <div className="flex items-center justify-between relative z-20">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-600" />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                className="w-full sm:w-80 pl-9 pr-4 py-2 rounded-md border border-secondary-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-800"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${statusFilter !== 'All'
                                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                                    : 'bg-secondary-50 border-secondary-200 text-secondary-600 hover:text-secondary-900'
                                    }`}
                            >
                                <Filter className="w-4 h-4" /> Filter
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 p-4 space-y-4 z-50">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-secondary-500 uppercase">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full text-sm border-secondary-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="New">New</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </div>
                                    {statusFilter !== 'All' && (
                                        <button
                                            onClick={() => setStatusFilter('All')}
                                            className="w-full text-xs text-red-600 hover:text-red-700 text-center mt-2 underline"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary-50 text-secondary-600 font-medium border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-3">Details</th>
                                    <th className="px-6 py-3">Requestor</th>
                                    <th className="px-6 py-3">Date Submitted</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-secondary-500">Loading requests...</td>
                                    </tr>
                                ) : filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-secondary-500">No requests found matching your filters.</td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-secondary-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-secondary-900 font-medium line-clamp-2 max-w-sm">{req.message}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-secondary-900">{req.name}</div>
                                                <div className="text-xs text-secondary-500">{req.email}</div>
                                                {req.contactNumber && <div className="text-xs text-secondary-500">{req.contactNumber}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-secondary-500 text-xs text-nowrap">
                                                {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' }) : (req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Just now')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.status === 'New' ? 'bg-blue-50 text-blue-700' :
                                                    req.status === 'Resolved' ? 'bg-green-50 text-green-700' :
                                                        'bg-secondary-100 text-secondary-600'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => openReview(req)}
                                                    className="font-medium text-primary-600 hover:text-primary-800 hover:underline"
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Review Request"
                className="max-w-xl"
            >
                {selectedRequest && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-secondary-500 mb-1">Requestor Details</h4>
                                <div className="bg-secondary-50 p-3 rounded-md">
                                    <p className="font-medium text-secondary-900">{selectedRequest.name}</p>
                                    <p className="text-sm text-secondary-600">{selectedRequest.email}</p>
                                    <p className="text-sm text-secondary-600">{selectedRequest.contactNumber}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-secondary-500 mb-1">Message</h4>
                                <div className="bg-white border border-secondary-200 p-4 rounded-md text-secondary-800">
                                    {selectedRequest.message}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-secondary-500">
                                <Clock className="w-4 h-4" />
                                Submitted on {selectedRequest.createdAt?.toDate ? new Date(selectedRequest.createdAt.toDate()).toLocaleString() : 'Unknown date'}
                            </div>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-secondary-100">
                            <button
                                onClick={() => handleDelete(selectedRequest.id!)}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm font-medium"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Request
                            </button>

                            <div className="flex gap-2">
                                {selectedRequest.status !== 'Resolved' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedRequest.id!, 'Resolved')}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                                    >
                                        <Check className="w-4 h-4" /> Mark as Resolved
                                    </button>
                                )}
                                {selectedRequest.status === 'Resolved' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedRequest.id!, 'New')}
                                        className="flex items-center gap-2 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-md hover:bg-secondary-200 transition-colors text-sm font-medium"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Reopen Request
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

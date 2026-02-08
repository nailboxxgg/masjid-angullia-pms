"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Clock, Check, X, Trash2, RotateCcw, AlertCircle } from "lucide-react";
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

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

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

    const handleDelete = (id: string) => {
        setRequestToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!requestToDelete) return;

        const success = await deleteFeedback(requestToDelete);
        if (success) {
            loadData();
            setIsModalOpen(false);
            setIsDeleteModalOpen(false);
            setRequestToDelete(null);
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
                    <h1 className="text-2xl font-bold tracking-tight text-secondary-900 dark:text-secondary-100 font-heading">Service Requests</h1>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">Manage community requests and applications.</p>
                </div>
            </div>

            <Card className="shadow-sm dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 transition-colors duration-300">
                <CardHeader className="pb-3 border-b border-secondary-100 dark:border-secondary-800">
                    <div className="flex items-center justify-between relative z-20">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                className="w-full sm:w-80 pl-9 pr-4 py-2 rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-800 dark:text-secondary-100 transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${statusFilter !== 'All'
                                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400'
                                    : 'bg-secondary-50 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
                                    }`}
                            >
                                <Filter className="w-4 h-4" /> Filter
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-secondary-900 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-800 p-4 space-y-4 z-50 transition-colors">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full text-sm border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100 rounded-md focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="New">New</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </div>
                                    {statusFilter !== 'All' && (
                                        <button
                                            onClick={() => setStatusFilter('All')}
                                            className="w-full text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-center mt-2 underline"
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
                            <thead className="bg-secondary-50 dark:bg-secondary-800/50 text-secondary-600 dark:text-secondary-400 font-medium border-b border-secondary-200 dark:border-secondary-800 transition-colors">
                                <tr>
                                    <th className="px-6 py-3 text-secondary-900 dark:text-secondary-100">Details</th>
                                    <th className="px-6 py-3 text-secondary-900 dark:text-secondary-100">Requestor</th>
                                    <th className="px-6 py-3 text-secondary-900 dark:text-secondary-100">Date Submitted</th>
                                    <th className="px-6 py-3 text-secondary-900 dark:text-secondary-100">Status</th>
                                    <th className="px-6 py-3 text-secondary-900 dark:text-secondary-100">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800 transition-colors">
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
                                        <tr key={req.id} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-secondary-900 dark:text-secondary-100 font-medium line-clamp-2 max-w-sm">{req.message}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-secondary-900 dark:text-secondary-100">{req.name}</div>
                                                <div className="text-xs text-secondary-500 dark:text-secondary-400">{req.email}</div>
                                                {req.contactNumber && <div className="text-xs text-secondary-500 dark:text-secondary-400">{req.contactNumber}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-secondary-500 dark:text-secondary-400 text-xs text-nowrap">
                                                {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' }) : (req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Just now')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${req.status === 'New' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                                                    req.status === 'Resolved' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                                                        'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 border-secondary-200 dark:border-secondary-700'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => openReview(req)}
                                                    className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:underline"
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
                                <h4 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 mb-1">Requestor Details</h4>
                                <div className="bg-secondary-50 dark:bg-secondary-800 p-3 rounded-md transition-colors">
                                    <p className="font-medium text-secondary-900 dark:text-secondary-100">{selectedRequest.name}</p>
                                    <p className="text-sm text-secondary-600 dark:text-secondary-400">{selectedRequest.email}</p>
                                    <p className="text-sm text-secondary-600 dark:text-secondary-400">{selectedRequest.contactNumber}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 mb-1">Message</h4>
                                <div className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 p-4 rounded-md text-secondary-800 dark:text-secondary-100 transition-colors">
                                    {selectedRequest.message}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400">
                                <Clock className="w-4 h-4" />
                                Submitted on {selectedRequest.createdAt?.toDate ? new Date(selectedRequest.createdAt.toDate()).toLocaleString() : 'Unknown date'}
                            </div>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-secondary-100 dark:border-secondary-800">
                            <button
                                onClick={() => handleDelete(selectedRequest.id!)}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors text-sm font-medium"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Request
                            </button>

                            <div className="flex gap-2">
                                {selectedRequest.status !== 'Resolved' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedRequest.id!, 'Resolved')}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-800 transition-colors text-sm font-medium shadow-sm"
                                    >
                                        <Check className="w-4 h-4" /> Mark as Resolved
                                    </button>
                                )}
                                {selectedRequest.status === 'Resolved' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedRequest.id!, 'New')}
                                        className="flex items-center gap-2 px-4 py-2 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors text-sm font-medium"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Reopen Request
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Request"
                className="max-w-sm"
            >
                <div className="flex flex-col items-center justify-center text-center py-4 bg-white dark:bg-secondary-900 transition-colors">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">Are you sure?</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                        This action cannot be undone. This request will be permanently removed from the system.
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 font-medium rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white font-medium rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors shadow-sm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

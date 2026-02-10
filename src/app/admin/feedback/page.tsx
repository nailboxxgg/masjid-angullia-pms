"use client";

import { useState, useEffect } from "react";
import { getFeedbacks, FeedbackData, updateFeedbackStatus, deleteFeedback } from "@/lib/feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { MessageSquare, Mail, Phone, Clock, Search, Filter, Trash2, Check, BookOpen, AlertCircle } from "lucide-react";

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getFeedbacks();
        setFeedbacks(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateStatus = async (id: string, status: 'Read' | 'Resolved') => {
        const success = await updateFeedbackStatus(id, status);
        if (success) {
            loadData();
            // Also update local state to reflect change immediately if needed, mainly for the modal view if open
            if (selectedFeedback && selectedFeedback.id === id) {
                setSelectedFeedback({ ...selectedFeedback, status });
            }
        }
    };

    const handleView = async (feedback: FeedbackData) => {
        setSelectedFeedback(feedback);
        setIsViewModalOpen(true);

        if (feedback.status === 'New' && feedback.id) {
            await handleUpdateStatus(feedback.id, 'Read');
        }
    };

    const handleDelete = (id: string) => {
        setFeedbackToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!feedbackToDelete) return;

        const success = await deleteFeedback(feedbackToDelete);
        if (success) {
            loadData();
            setIsDeleteModalOpen(false);
            setFeedbackToDelete(null);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Concern': return 'bg-red-50 text-red-700 border-red-200';
            case 'Request': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-green-50 text-green-700 border-green-200';
        }
    };

    const filteredFeedbacks = feedbacks.filter(item => {
        const matchesSearch = (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (item.message?.toLowerCase() || "").includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        const matchesType = typeFilter === 'All' || item.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-secondary-900 dark:text-secondary-100 font-heading">Feedback & Concerns</h1>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">Review submissions from the community.</p>
                </div>
            </div>

            <Card className="transition-colors duration-300 bg-secondary-900 border-secondary-800 dark:bg-white dark:border-secondary-200 !dark:bg-white !dark:border-secondary-200">
                <CardHeader>
                    <CardTitle className="text-lg text-white dark:text-secondary-900">Inbox</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex gap-2 mb-4 relative z-20">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400 dark:text-secondary-500" />
                            <input
                                type="search"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 h-9 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors bg-secondary-800 border-secondary-700 text-secondary-100 placeholder:text-secondary-500 dark:bg-secondary-50 dark:border-secondary-200 dark:text-secondary-900 dark:placeholder:text-secondary-400"
                            />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-3 h-9 border rounded-md text-sm transition-colors ${statusFilter !== 'All' || typeFilter !== 'All'
                                    ? 'bg-primary-900/50 border-primary-800 text-primary-400 dark:bg-primary-50 dark:border-primary-200 dark:text-primary-700'
                                    : 'border-secondary-700 text-secondary-400 hover:bg-white/5 dark:border-secondary-200 dark:text-secondary-600 dark:hover:bg-secondary-50'
                                    }`}
                            >
                                <Filter className="w-3 h-3" /> Filter
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-secondary-900 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-800 p-4 space-y-4 z-50 transition-colors">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full text-sm border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 rounded-md focus:ring-primary-500 focus:border-primary-500 text-secondary-800 dark:text-secondary-100 transition-colors"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="New">New</option>
                                            <option value="Read">Read</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase">Type</label>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="w-full text-sm border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 rounded-md focus:ring-primary-500 focus:border-primary-500 text-secondary-800 dark:text-secondary-100 transition-colors"
                                        >
                                            <option value="All">All Types</option>
                                            <option value="Message">Message</option>
                                            <option value="Concern">Concern</option>
                                            <option value="Request">Request</option>
                                        </select>
                                    </div>
                                    {(statusFilter !== 'All' || typeFilter !== 'All') && (
                                        <button
                                            onClick={() => { setStatusFilter('All'); setTypeFilter('All'); }}
                                            className="w-full text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-center mt-2 underline"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <p className="text-center py-8 text-secondary-500">Loading...</p>
                        ) : filteredFeedbacks.length === 0 ? (
                            <div className="text-center py-12 bg-secondary-50 dark:bg-secondary-800/30 rounded-xl border border-dashed border-secondary-200 dark:border-secondary-700 transition-colors">
                                <MessageSquare className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
                                <p className="text-secondary-500 dark:text-secondary-400">No feedback items found matching your filters.</p>
                            </div>
                        ) : (
                            filteredFeedbacks.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleView(item)}
                                    className="p-4 rounded-xl border hover:shadow-sm transition-all group cursor-pointer bg-white/5 border-white/10 hover:border-white/20 dark:bg-secondary-50 dark:border-secondary-200 dark:hover:border-primary-300 !dark:bg-secondary-50 !dark:border-secondary-200"
                                >
                                    <div className="flex flex-col md:flex-row gap-4 items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold transition-colors bg-white/10 text-white dark:bg-secondary-200 dark:text-secondary-700">
                                                {item.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-white dark:text-secondary-900">{item.name}</h4>
                                                <div className="flex items-center gap-3 text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                                                    {item.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" /> {item.email}
                                                        </span>
                                                    )}
                                                    {item.contactNumber && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {item.contactNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium border ${item.type === 'Concern' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                                                item.type === 'Request' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                                                    'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                                }`}>
                                                {item.type}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium border ${item.status === 'New' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                                                item.status === 'Resolved' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                                                    'bg-gray-100 dark:bg-secondary-800 text-gray-700 dark:text-secondary-300 border-gray-200 dark:border-secondary-700'
                                                }`}>
                                                {item.status}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-secondary-400 dark:text-secondary-500">
                                                <Clock className="w-3 h-3" />
                                                {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' }) : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pl-0 md:pl-13 ml-0 md:ml-13">
                                        <p className="text-sm p-3 rounded-lg mb-3 line-clamp-2 transition-colors text-secondary-300 bg-black/20 dark:text-secondary-600 dark:bg-white/50">
                                            {item.message}
                                        </p>

                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.status !== 'Resolved' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateStatus(item.id!, 'Resolved');
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors"
                                                    title="Resolve"
                                                >
                                                    <Check className="w-3.5 h-3.5" /> Resolve
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.id!);
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={selectedFeedback ? `${selectedFeedback.type} Details` : "Feedback Details"}
                className="max-w-xl"
            >
                {selectedFeedback && (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between border-b border-secondary-100 dark:border-secondary-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center shrink-0 text-secondary-600 dark:text-secondary-300 font-bold text-lg transition-colors">
                                    {selectedFeedback.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 text-lg">{selectedFeedback.name}</h4>
                                    <div className="flex flex-col text-sm text-secondary-500 dark:text-secondary-400">
                                        {selectedFeedback.email && (
                                            <span className="flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5" /> {selectedFeedback.email}
                                            </span>
                                        )}
                                        {selectedFeedback.contactNumber && (
                                            <span className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5" /> {selectedFeedback.contactNumber}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${selectedFeedback.type === 'Concern' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                                    selectedFeedback.type === 'Request' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                                        'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                    }`}>
                                    {selectedFeedback.type}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-secondary-400 dark:text-secondary-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    {selectedFeedback.createdAt?.toDate ? new Date(selectedFeedback.createdAt.toDate()).toLocaleString() : "Unknown Date"}
                                </span>
                            </div>
                        </div>

                        <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-xl border border-secondary-100 dark:border-secondary-700 transition-colors">
                            <h5 className="text-xs font-semibold text-secondary-400 dark:text-secondary-500 uppercase mb-2">Message</h5>
                            <p className="text-secondary-800 dark:text-secondary-100 whitespace-pre-wrap leading-relaxed">
                                {selectedFeedback.message}
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 text-sm font-medium transition-colors"
                            >
                                Close
                            </button>
                            {selectedFeedback.status !== 'Resolved' && (
                                <button
                                    onClick={() => {
                                        handleUpdateStatus(selectedFeedback.id!, 'Resolved');
                                        setIsViewModalOpen(false);
                                    }}
                                    className="px-4 py-2 bg-green-600 dark:bg-green-700 rounded-lg text-white hover:bg-green-700 dark:hover:bg-green-800 text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Mark as Resolved
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Feedback"
                className="max-w-sm"
            >
                <div className="flex flex-col items-center justify-center text-center py-4 bg-white dark:bg-secondary-900 transition-colors">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">Are you sure?</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                        This action cannot be undone. This feedback entry will be permanently removed from the system.
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

"use client";

import { useState, useEffect } from "react";
import { getFeedbacks, FeedbackData, updateFeedbackStatus, deleteFeedback } from "@/lib/feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Mail, Phone, Clock, Search, Filter, Trash2, Check, BookOpen } from "lucide-react";

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); // Re-adding searchTerm state if needed or reuse existing input

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
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this feedback?")) {
            const success = await deleteFeedback(id);
            if (success) {
                loadData();
            }
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
                    <h1 className="text-2xl font-bold tracking-tight text-secondary-900 font-heading">Feedback & Concerns</h1>
                    <p className="text-sm text-secondary-500">Review submissions from the community.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg text-secondary-800">Inbox</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex gap-2 mb-4 relative z-20">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
                            <input
                                type="search"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 h-9 rounded-md border border-secondary-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-3 h-9 border rounded-md text-sm transition-colors ${statusFilter !== 'All' || typeFilter !== 'All'
                                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                                    : 'border-secondary-300 text-secondary-600 hover:bg-secondary-50'
                                    }`}
                            >
                                <Filter className="w-3 h-3" /> Filter
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 p-4 space-y-4 z-50">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-secondary-500 uppercase">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full text-sm border-secondary-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="New">New</option>
                                            <option value="Read">Read</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-secondary-500 uppercase">Type</label>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="w-full text-sm border-secondary-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
                                            className="w-full text-xs text-red-600 hover:text-red-700 text-center mt-2 underline"
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
                            <div className="text-center py-12 bg-secondary-50 rounded-xl border border-dashed border-secondary-200">
                                <MessageSquare className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                                <p className="text-secondary-500">No feedback items found matching your filters.</p>
                            </div>
                        ) : (
                            filteredFeedbacks.map((item) => (
                                <div key={item.id} className="p-4 rounded-xl border border-secondary-200 hover:border-primary-300 hover:shadow-sm transition-all bg-white group">
                                    <div className="flex flex-col md:flex-row gap-4 items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center shrink-0 text-secondary-600 font-bold">
                                                {item.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-secondary-900">{item.name}</h4>
                                                <div className="flex items-center gap-3 text-xs text-secondary-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {item.email}
                                                    </span>
                                                    {item.contactNumber && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {item.contactNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(item.type)}`}>
                                                {item.type}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium border ${item.status === 'New' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                item.status === 'Resolved' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    'bg-gray-100 text-gray-700 border-gray-200'
                                                }`}>
                                                {item.status}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-secondary-400">
                                                <Clock className="w-3 h-3" />
                                                {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' }) : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pl-13 md:pl-13 ml-0 md:ml-13">
                                        <p className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-lg mb-3">
                                            {item.message}
                                        </p>

                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.status === 'New' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(item.id!, 'Read')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-600 hover:bg-secondary-100 rounded-md transition-colors"
                                                    title="Mark as Read"
                                                >
                                                    <BookOpen className="w-3.5 h-3.5" /> Read
                                                </button>
                                            )}
                                            {item.status !== 'Resolved' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(item.id!, 'Resolved')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                                    title="Resolve"
                                                >
                                                    <Check className="w-3.5 h-3.5" /> Resolve
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(item.id!)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
        </div>
    );
}

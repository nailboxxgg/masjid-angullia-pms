"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getFeedbacksByType, FeedbackData } from "@/lib/feedback";

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<FeedbackData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const data = await getFeedbacksByType('Request');
            setRequests(data);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const filteredRequests = requests.filter(req =>
        req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                        <td colSpan={5} className="px-6 py-8 text-center text-secondary-500">No requests found.</td>
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
                                                {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Just now'}
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
                                                <button className="font-medium text-primary-600 hover:text-primary-800 hover:underline">Review</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

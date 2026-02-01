"use client";

import { useState, useEffect } from "react";
import { getFeedbacks, FeedbackData } from "@/lib/feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Mail, Phone, Clock, Search, Filter } from "lucide-react";

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const data = await getFeedbacks();
            setFeedbacks(data);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Concern': return 'bg-red-50 text-red-700 border-red-200';
            case 'Request': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-green-50 text-green-700 border-green-200';
        }
    };

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
                    <CardTitle className="text-lg">Inbox</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters (Mock) */}
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
                            <input
                                type="search"
                                placeholder="Search..."
                                className="w-full pl-9 h-9 rounded-md border border-secondary-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-3 h-9 border border-secondary-300 rounded-md text-sm text-secondary-600 hover:bg-secondary-50">
                            <Filter className="w-3 h-3" /> Filter
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <p className="text-center py-8 text-secondary-500">Loading...</p>
                        ) : feedbacks.length === 0 ? (
                            <div className="text-center py-12 bg-secondary-50 rounded-xl border border-dashed border-secondary-200">
                                <MessageSquare className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                                <p className="text-secondary-500">No feedback submissions yet.</p>
                            </div>
                        ) : (
                            feedbacks.map((item) => (
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
                                            <span className="flex items-center gap-1 text-xs text-secondary-400">
                                                <Clock className="w-3 h-3" />
                                                {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pl-13 md:pl-13 ml-0 md:ml-13">
                                        <p className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-lg">
                                            {item.message}
                                        </p>
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

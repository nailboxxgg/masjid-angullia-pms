"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, ShieldCheck } from "lucide-react";
import { getAnnouncements } from "@/lib/announcements";
import { Announcement } from "@/lib/types";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import Footer from "@/components/layout/Footer";

export default function UpdatesPage() {
    const [updates, setUpdates] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUpdates = async () => {
            setIsLoading(true);
            const data = await getAnnouncements(50); // Fetch more for the full list
            setUpdates(data);
            setIsLoading(false);
        };
        fetchUpdates();
    }, []);

    return (
        <AnimationWrapper className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navigation */}
            <div className="max-w-7xl mx-auto w-full px-6 py-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-secondary-500 hover:text-primary-600 transition-colors font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-7xl w-full mx-auto px-6 pb-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold font-heading text-secondary-900 mb-4">Community Updates</h1>
                    <p className="text-secondary-500 max-w-2xl mx-auto">
                        Stay informed with the latest announcements, events, and news from Masjid Angullia.
                    </p>
                </div>

                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-secondary-500">Loading updates...</p>
                    </div>
                ) : updates.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-secondary-200">
                        <p className="text-secondary-500">No updates found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {updates.map((post, index) => (
                            <AnimationWrapper
                                key={post.id}
                                delay={index * 0.1}
                                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-secondary-100 hover:shadow-md transition-all flex flex-col h-full"
                            >
                                {/* Image Section (if available) */}
                                {post.imageUrl && (
                                    <div className="relative h-48 w-full bg-secondary-100">
                                        <Image
                                            src={post.imageUrl}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${post.type === 'Urgent' ? 'bg-red-600' :
                                                    post.type === 'Event' ? 'bg-primary-600' : 'bg-secondary-800'
                                                }`}>
                                                {post.type}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {!post.imageUrl && (
                                    <div className="pt-6 px-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${post.type === 'Urgent' ? 'bg-red-50 text-red-600' :
                                                    post.type === 'Event' ? 'bg-primary-50 text-primary-600' : 'bg-secondary-100 text-secondary-600'
                                                }`}>
                                                {post.type}
                                            </span>
                                            <span className="text-xs text-secondary-400">
                                                {new Date(post.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 pt-2 flex-1 flex flex-col">
                                    {post.imageUrl && (
                                        <div className="flex items-center gap-2 text-xs text-secondary-400 mb-3 mt-2">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(post.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold font-heading text-secondary-900 mb-3">{post.title}</h3>
                                    <p className="text-secondary-600 text-sm line-clamp-4 mb-4 flex-1">
                                        {post.content}
                                    </p>

                                </div>
                            </AnimationWrapper>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </AnimationWrapper>
    );
}

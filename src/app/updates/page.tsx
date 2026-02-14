"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Clock, ShieldCheck, ThumbsUp, MessageCircle, MoreHorizontal, ArrowLeft, Heart } from "lucide-react";
import { getAnnouncements } from "@/lib/announcements";
import { Announcement } from "@/lib/types";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import Footer from "@/components/layout/Footer";
import { cn, formatTimeAgo } from "@/lib/utils";
import SocialPost from "@/components/feed/SocialPost";
import Link from "next/link";

export default function UpdatesPage() {
    const [updates, setUpdates] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUpdates = async () => {
            setIsLoading(true);
            const data = await getAnnouncements(30);
            setUpdates(data || []);
            setIsLoading(false);
        };
        fetchUpdates();
    }, []);

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col transition-colors duration-300">
            {/* Header Area */}
            <div className="bg-white dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-bold text-sm"
                    >
                        <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden xs:inline">Back</span>
                    </Link>
                    <h1 className="text-base md:text-xl font-bold font-heading text-secondary-900 dark:text-white truncate px-2">Community Updates</h1>
                    <div className="w-10 md:w-12 shrink-0" /> {/* Spacer */}
                </div>
            </div>

            {/* Main Feed Container */}
            <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-secondary-900 rounded-2xl p-4 shadow-sm animate-pulse">
                                <div className="flex gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800" />
                                    <div className="space-y-2">
                                        <div className="w-32 h-3 bg-secondary-100 dark:bg-secondary-800 rounded" />
                                        <div className="w-24 h-2 bg-secondary-100 dark:bg-secondary-800 rounded" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="w-full h-4 bg-secondary-100 dark:bg-secondary-800 rounded" />
                                    <div className="w-3/4 h-4 bg-secondary-100 dark:bg-secondary-800 rounded" />
                                    <div className="w-full aspect-video bg-secondary-100 dark:bg-secondary-800 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : updates.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-secondary-900 rounded-3xl border border-dashed border-secondary-200 dark:border-secondary-800">
                        <Heart className="w-12 h-12 text-secondary-200 mx-auto mb-4" />
                        <p className="text-secondary-500">No updates posted yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4 md:space-y-6">
                        {updates.map((post, idx) => (
                            <SocialPost key={post.id} post={post} delay={idx * 0.05} />
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

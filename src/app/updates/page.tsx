"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck, ThumbsUp, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { getAnnouncements } from "@/lib/announcements";
import { Announcement } from "@/lib/types";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import Footer from "@/components/layout/Footer";
import { cn, formatTimeAgo } from "@/lib/utils";
import { motion } from "framer-motion";
import SocialPost from "@/components/feed/SocialPost";

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
        <AnimationWrapper className="min-h-screen bg-gray-50 dark:bg-secondary-950 flex flex-col transition-colors duration-300">
            {/* Top Navigation */}
            <div className="bg-secondary-900 py-6">
                <div className="max-w-7xl mx-auto w-full px-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all text-sm font-medium group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-7xl w-full mx-auto px-6 pb-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold font-heading text-secondary-900 dark:text-secondary-100 mb-4">Community Updates</h1>
                    <p className="text-secondary-500 dark:text-secondary-400 max-w-2xl mx-auto">
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
                    <div className="max-w-2xl mx-auto space-y-6">
                        {updates.map((post) => (
                            <SocialPost key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </AnimationWrapper>
    );
}

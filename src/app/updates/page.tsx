"use client";

import { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import Image from "next/image";
import { Clock, ShieldCheck, ThumbsUp, MessageCircle, MoreHorizontal, ArrowLeft, Heart } from "lucide-react";
import { getAnnouncements, getPaginatedAnnouncements } from "@/lib/announcements";
import { getEvents } from "@/lib/events";
import { Announcement, Event } from "@/lib/types";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import Footer from "@/components/layout/Footer";
import { cn, formatTimeAgo } from "@/lib/utils";
import SocialPost from "@/components/feed/SocialPost";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";

export default function UpdatesPage() {
    const [updates, setUpdates] = useState<(Announcement | Event)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Auth Listener - Single Subscription for all posts
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Initial Fetch
    useEffect(() => {
        const fetchUpdates = async () => {
            setIsLoading(true);
            const [{ data, lastDoc: last }, eventData] = await Promise.all([
                getPaginatedAnnouncements(10),
                getEvents(10)
            ]);

            // Merge and sort
            const merged = [
                ...(data || []),
                ...(eventData || [])
            ].sort((a, b) => {
                const timeA = a.createdAt || (('date' in a && !isNaN(Date.parse((a as Event).date))) ? Date.parse((a as Event).date) : 0);
                const timeB = b.createdAt || (('date' in b && !isNaN(Date.parse((b as Event).date))) ? Date.parse((b as Event).date) : 0);
                return timeB - timeA;
            });

            setUpdates(merged);
            setLastDoc(last);
            setHasMore(data.length === 10);
            setIsLoading(false);
        };
        fetchUpdates();
    }, []);

    const handleLoadMore = async () => {
        if (isLoadingMore || !lastDoc) return;
        setIsLoadingMore(true);
        const { data, lastDoc: last } = await getPaginatedAnnouncements(10, lastDoc);

        if (data.length > 0) {
            setUpdates(prev => [...prev, ...data]);
            setLastDoc(last);
            setHasMore(data.length === 10);
        } else {
            setHasMore(false);
        }
        setIsLoadingMore(false);
    };

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col transition-colors duration-300">
            <Navbar />

            {/* Main Feed Container */}
            <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 pt-24">
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
                            <SocialPost
                                key={post.id}
                                post={post}
                                delay={idx < 5 ? idx * 0.05 : 0}
                                currentUser={currentUser}
                            />
                        ))}

                        {hasMore && (
                            <div className="pt-4 flex justify-center">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                    className="px-6 py-2.5 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-300 font-bold rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load More Updates"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { Heart } from "lucide-react";
import SocialPost from "@/components/feed/SocialPost";
import { useMember } from "@/contexts/MemberContext";
import { getAnnouncements } from "@/lib/announcements";
import { Announcement } from "@/lib/types";

export default function MemberUpdatesPage() {
    const { user } = useMember();
    const [updates, setUpdates] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAnnouncements(25, true)
            .then(setUpdates)
            .catch((error) => console.error("Failed to load member updates:", error))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="space-y-5">
            <div className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                <p className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">Members only</p>
                <h1 className="mt-2 text-2xl font-black text-secondary-900 dark:text-white">Member Updates</h1>
                <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
                    Private announcements and community notices shared with signed-in members.
                </p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-52 animate-pulse rounded-2xl bg-white shadow-sm dark:bg-secondary-900" />
                    ))}
                </div>
            ) : updates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-secondary-200 bg-white p-10 text-center dark:border-secondary-800 dark:bg-secondary-900">
                    <Heart className="mx-auto h-10 w-10 text-secondary-300" />
                    <p className="mt-3 font-bold text-secondary-700 dark:text-secondary-200">No member updates yet.</p>
                </div>
            ) : (
                <div className="mx-auto max-w-2xl space-y-4">
                    {updates.map((post, index) => (
                        <SocialPost
                            key={`${post.audience || "public"}-${post.id}`}
                            post={post}
                            delay={index < 5 ? index * 0.05 : 0}
                            currentUser={user as User | null}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

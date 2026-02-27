"use client";

import { useMemo } from "react";
import { Clock, ArrowRight, ShieldCheck, Zap, Calendar } from "lucide-react";
import { Announcement, Event } from "@/lib/types";
import { formatTimeAgo, cn } from "@/lib/utils";
import AnimationWrapper from "@/components/ui/AnimationWrapper";

interface AnnouncementCardProps {
    post: Announcement | Event;
    delay?: number;
    onClick?: () => void;
}

export default function AnnouncementCard({ post, delay = 0, onClick }: AnnouncementCardProps) {
    const isEvent = 'location' in post;
    const title = post.title;
    const content = 'content' in post ? post.content : (post as Event).description;
    const createdAt = useMemo(() => post.createdAt || ('date' in post && !isNaN(Date.parse(post.date)) ? Date.parse(post.date) : 0), [post]);
    const type = 'type' in post ? post.type : 'Event';

    return (
        <AnimationWrapper animation="reveal" duration={0.8} delay={delay}>
            <div
                className={cn(
                    "group relative h-full min-h-[240px] rounded-3xl p-6 shadow-xl transition-all duration-500 border overflow-hidden",
                    "bg-white border-secondary-100 text-secondary-900 hover:shadow-2xl hover:-translate-y-1", // Light
                    "dark:bg-secondary-900 dark:border-secondary-800 dark:text-white dark:hover:shadow-primary-900/10" // Dark
                )}
            >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors"></div>

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                                {isEvent ? <Calendar className="w-4 h-4" /> : "MA"}
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold tracking-tight">
                                        {isEvent ? "Community Event" : "Masjid Angullia"}
                                    </span>
                                    <ShieldCheck className="w-3 h-3 text-primary-500 fill-primary-500" />
                                </div>
                                <span className="text-[10px] text-secondary-400 dark:text-secondary-500 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> {formatTimeAgo(createdAt)}
                                </span>
                            </div>
                        </div>
                        {type === 'Urgent' && (
                            <div className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                <Zap className="w-2.5 h-2.5" /> Urgent
                            </div>
                        )}
                        {isEvent && (
                            <div className="flex items-center gap-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                <Calendar className="w-2.5 h-2.5" /> Event
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <h4 className="text-lg font-bold font-heading leading-tight mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {title}
                        </h4>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-3 leading-relaxed">
                            {content}
                        </p>
                    </div>

                    {/* Footer Button */}
                    <div className="mt-6">
                        <button
                            onClick={onClick}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-50 dark:bg-white/5 text-secondary-900 dark:text-white text-xs font-bold hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-all group/btn w-full justify-center border border-secondary-100 dark:border-white/5"
                        >
                            {isEvent ? "Event Details" : "Read Full Story"}
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </AnimationWrapper>
    );
}

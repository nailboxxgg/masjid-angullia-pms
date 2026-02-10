"use client";

import Image from "next/image";
import { ShieldCheck, Clock, MoreHorizontal, ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { Announcement } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import FacebookEmbed from "@/components/ui/FacebookEmbed";

interface SocialPostProps {
    post: Announcement;
    delay?: number;
}

export default function SocialPost({ post, delay = 0 }: SocialPostProps) {
    return (
        <AnimationWrapper animation="reveal" duration={0.6} delay={delay}>
            <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-sm border border-secondary-100 dark:border-secondary-800 overflow-hidden hover:shadow-md transition-all duration-300">
                {/* Social Post Header */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-inner shrink-0 leading-none">
                            <span className="font-bold text-sm">MA</span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-secondary-900 dark:text-secondary-100 leading-none text-sm md:text-base truncate">Masjid Angullia</h4>
                                <ShieldCheck className="w-3.5 h-3.5 text-primary-500 fill-primary-500 shrink-0" />
                            </div>
                            <p className="text-[10px] md:text-xs text-secondary-500 dark:text-secondary-400 mt-1 flex items-center gap-1">
                                {formatTimeAgo(post.createdAt || post.date)} • <Clock className="w-3 h-3" />
                            </p>
                        </div>
                    </div>
                    <button className="text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors p-1 shrink-0">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>

                {/* Post Body */}
                <div className="px-4 pb-3">
                    <h5 className="text-lg font-bold text-secondary-900 dark:text-secondary-100 mb-2 line-clamp-2 md:line-clamp-none leading-tight">{post.title}</h5>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {post.content}
                    </p>
                </div>

                {/* Media Section */}
                {post.externalUrl ? (
                    <FacebookEmbed url={post.externalUrl} />
                ) : (
                    <div className="relative aspect-video w-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
                        <Image
                            src={post.imageUrl || "/images/mosque2.png"}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {post.type === 'Urgent' && (
                            <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-lg z-10">
                                Urgent
                            </div>
                        )}
                    </div>
                )}

                {/* Action Bar */}
                <div className="p-2 border-t border-secondary-50 dark:border-secondary-800 flex items-center justify-between px-2 md:px-4">
                    <div className="flex items-center gap-1">
                        <button className="flex items-center gap-2 px-3 py-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-lg transition-colors text-xs md:text-sm font-medium group">
                            <ThumbsUp className="w-4 h-4 md:w-5 h-5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                            <span>Like</span>
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-lg transition-colors text-xs md:text-sm font-medium">
                            <MessageCircle className="w-4 h-4 md:w-5 h-5" />
                            <span>Comment</span>
                        </button>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-lg transition-colors text-xs md:text-sm font-medium">
                        <Share2 className="w-4 h-4 md:w-5 h-5" />
                        <span>Share</span>
                    </button>
                </div>
            </div>
        </AnimationWrapper>
    );
}

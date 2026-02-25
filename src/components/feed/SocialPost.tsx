"use client";

import { useState, useMemo } from "react";
import { ShieldCheck, Clock, MoreHorizontal, ThumbsUp, MessageCircle, Send, Calendar } from "lucide-react";
import { Announcement, Comment, Event } from "@/lib/types";
import { formatTimeAgo, cn } from "@/lib/utils";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import FacebookEmbed from "@/components/ui/FacebookEmbed";
import { toggleLikeAnnouncement, addCommentToAnnouncement } from "@/lib/announcements";
import { motion, AnimatePresence } from "framer-motion";

import { User } from "firebase/auth";

interface SocialPostProps {
    post: Announcement | Event;
    delay?: number;
    currentUser?: User | null;
}

export default function SocialPost({ post, delay = 0, currentUser = null }: SocialPostProps) {
    const isEvent = 'location' in post;
    const [likes, setLikes] = useState<string[]>(('likes' in post ? post.likes : []) || []);
    const [comments, setComments] = useState<Comment[]>(('comments' in post ? post.comments : []) || []);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userId = currentUser?.uid;
    const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "User";

    const isLiked = useMemo(() => userId ? likes.includes(userId) : false, [likes, userId]);

    const handleLike = async () => {
        if (!userId) {
            window.dispatchEvent(new CustomEvent('open-login-modal'));
            return;
        }

        const newLikedState = !isLiked;
        setLikes(prev => newLikedState ? [...prev, userId] : prev.filter(id => id !== userId));

        await toggleLikeAnnouncement(post.id, userId, !newLikedState);
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const commentData: Omit<Comment, "id"> = {
            userId,
            userName: userName || "User",
            content: newComment.trim(),
            createdAt: Date.now()
        };

        const addedComment = await addCommentToAnnouncement(post.id, commentData);
        if (addedComment) {
            setComments(prev => [...prev, addedComment]);
            setNewComment("");
        }
        setIsSubmitting(false);
    };

    const handleRedirect = () => {
        if (!isEvent && (post as Announcement).externalUrl) {
            window.open((post as Announcement).externalUrl!, '_blank');
        }
    };


    return (
        <AnimationWrapper animation="reveal" duration={0.6} delay={delay}>
            <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-sm border border-secondary-100 dark:border-secondary-800 overflow-hidden hover:shadow-md transition-all duration-300">
                {/* Social Post Header */}
                <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-inner shrink-0 leading-none">
                            {isEvent ? <Calendar className="w-5 h-5" /> : <span className="font-bold text-xs">MA</span>}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-secondary-900 dark:text-secondary-100 leading-none text-sm md:text-base truncate">
                                    {isEvent ? "Community Event" : "Masjid Angullia"}
                                </h4>
                                <ShieldCheck className="w-3.5 h-3.5 text-primary-500 fill-primary-500 shrink-0" />
                            </div>
                            <p className="text-[10px] md:text-xs text-secondary-500 dark:text-secondary-400 mt-1 flex items-center gap-1">
                                {formatTimeAgo(post.createdAt || (isEvent ? Date.parse((post as Event).date) : (post as Announcement).date))} • <Clock className="w-3 h-3" />
                            </p>
                        </div>
                    </div>
                    <button className="text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors p-1 shrink-0">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>

                {/* Post Body - Clickable if External URL exists */}
                <div
                    className={cn(
                        "px-4 pb-3",
                        !isEvent && (post as Announcement).externalUrl && "cursor-pointer hover:bg-secondary-50/50 dark:hover:bg-secondary-800/20 transition-colors",
                        !isEvent && !(post as Announcement).externalUrl && "py-8 md:py-12 bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-inner"
                    )}
                    onClick={() => !isEvent && handleRedirect()}
                >
                    <h5 className={cn(
                        "font-bold mb-2 leading-tight",
                        !isEvent && !(post as Announcement).externalUrl ? "text-xl md:text-3xl text-center font-heading" : "text-base text-secondary-900 dark:text-secondary-100 line-clamp-2 md:line-clamp-none"
                    )}>
                        {post.title}
                    </h5>
                    <p className={cn(
                        "leading-relaxed whitespace-pre-wrap break-words",
                        !isEvent && !(post as Announcement).externalUrl ? "text-base md:text-xl text-center opacity-90 max-w-xl mx-auto" : "text-sm text-secondary-600 dark:text-secondary-400"
                    )}>
                        {isEvent ? (post as Event).description : (post as Announcement).content}
                    </p>
                </div>

                {/* Media Section */}
                {!isEvent && (post as Announcement).externalUrl ? (
                    <div className="cursor-pointer" onClick={handleRedirect}>
                        <FacebookEmbed url={(post as Announcement).externalUrl!} />
                    </div>
                ) : null}

                {/* Engagement Stats */}
                <div className="px-4 py-2 border-t border-secondary-50 dark:border-secondary-800/50 flex items-center justify-between text-xs text-secondary-500">
                    <div className="flex items-center gap-1">
                        {likes.length > 0 && (
                            <>
                                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white scale-75">
                                    <ThumbsUp size={10} fill="white" />
                                </div>
                                <span>{likes.length}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {comments.length > 0 && (
                            <span>{comments.length} comments</span>
                        )}
                    </div>
                </div>

                {/* Action Buttons - Only show for Announcements (where likes/comments are supported) */}
                {!isEvent && (
                    <div className="px-1.5 py-1 border-t border-secondary-50 dark:border-secondary-800/50 flex items-center gap-1">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                            onClick={handleLike}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors text-sm font-semibold",
                                isLiked ? "text-blue-600 dark:text-blue-400" : "text-secondary-600 dark:text-secondary-400"
                            )}
                        >
                            <motion.div
                                animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ThumbsUp className={cn("w-5 h-5", isLiked && "fill-current")} />
                            </motion.div>
                            Like
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                            onClick={() => setShowComments(!showComments)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors text-sm font-semibold text-secondary-600 dark:text-secondary-400"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Comment
                        </motion.button>
                    </div>
                )}

                {/* Comments Section */}
                {showComments && (
                    <div className="px-4 pb-4 bg-secondary-50/30 dark:bg-secondary-800/10 transition-all border-t border-secondary-50 dark:border-secondary-800/50">
                        {/* Comment List */}
                        <div className="space-y-4 pt-4 max-h-[300px] overflow-y-auto no-scrollbar">
                            {comments.map((cmt) => (
                                <div key={cmt.id} className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-bold">{cmt.userName[0].toUpperCase()}</span>
                                    </div>
                                    <div className="bg-secondary-100 dark:bg-secondary-800/80 rounded-2xl px-3 py-2 max-w-[85%]">
                                        <p className="text-xs font-bold text-secondary-900 dark:text-secondary-100 mb-0.5">{cmt.userName}</p>
                                        <p className="text-sm text-secondary-700 dark:text-secondary-300 leading-relaxed">{cmt.content}</p>
                                        <p className="text-[10px] text-secondary-400 mt-1">{formatTimeAgo(cmt.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handleComment} className="mt-4 flex gap-2 items-center">
                            <div className="w-8 h-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold">{userName?.[0]?.toUpperCase() || "U"}</span>
                            </div>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="w-full bg-secondary-100 dark:bg-secondary-800 border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-primary-500 pr-10 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 disabled:opacity-30 transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AnimationWrapper>
    );
}

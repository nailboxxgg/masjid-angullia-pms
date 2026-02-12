"use client";

import { useState } from "react";
import AnnouncementsManager from "@/components/admin/feed/AnnouncementsManager";
import EventsManager from "@/components/admin/feed/EventsManager";
import { Megaphone, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminFeedPage() {
    const [activeTab, setActiveTab] = useState<'announcements' | 'events'>('announcements');

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-10"
        >
            <motion.div
                variants={itemVariants}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white uppercase tracking-tighter">Feed & Events</h1>
                    <p className="text-secondary-900 dark:text-secondary-200 mt-1 font-medium italic">Manage community updates and upcoming activities.</p>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 rounded-2xl bg-secondary-100/50 dark:bg-secondary-900 ring-1 ring-secondary-200 dark:ring-secondary-800 shadow-inner">
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                            activeTab === 'announcements'
                                ? "bg-white text-primary-700 shadow-md transform scale-[1.02] dark:bg-secondary-800 dark:text-primary-400"
                                : "text-secondary-500 hover:text-secondary-900 dark:hover:text-white"
                        )}
                    >
                        <Megaphone className="w-4 h-4" />
                        Announcements
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                            activeTab === 'events'
                                ? "bg-white text-primary-700 shadow-md transform scale-[1.02] dark:bg-secondary-800 dark:text-primary-400"
                                : "text-secondary-500 hover:text-secondary-900 dark:hover:text-white"
                        )}
                    >
                        <Calendar className="w-4 h-4" />
                        Events
                    </button>
                </div>
            </motion.div>

            {/* Content Area */}
            <motion.div
                variants={itemVariants}
                className="min-h-[500px]"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'announcements' ? (
                            <AnnouncementsManager />
                        ) : (
                            <EventsManager />
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

"use client";

import AnnouncementsManager from "@/components/admin/feed/AnnouncementsManager";
import { motion } from "framer-motion";

export default function AdminFeedPage() {
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
                    <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white uppercase tracking-tighter">Announcements</h1>
                    <p className="text-secondary-900 dark:text-secondary-200 mt-1 font-medium italic">Post and manage community updates and events.</p>
                </div>
            </motion.div>

            {/* Content Area */}
            <motion.div
                variants={itemVariants}
                className="min-h-[500px]"
            >
                <AnnouncementsManager />
            </motion.div>
        </motion.div>
    );
}

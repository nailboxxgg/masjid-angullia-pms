
"use client";

import { useState, useEffect } from "react";
import { AdminPresence, subscribeToActiveAdmins } from "@/lib/presence";
import { Search } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminHeader() {
    const [activeAdmins, setActiveAdmins] = useState<AdminPresence[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToActiveAdmins((admins) => {
            setActiveAdmins(admins);
        });
        return () => unsubscribe();
    }, []);

    return (
        <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-6 sticky top-0 z-40">
            {/* Left: Search (Placeholder) */}
            <div className="flex items-center w-full max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-4 py-2 text-sm border-none bg-secondary-50 rounded-lg focus:ring-1 focus:ring-primary-500 text-secondary-900 placeholder-secondary-400"
                    />
                </div>
            </div>

            {/* Right: Presence & Notifications */}
            <div className="flex items-center gap-4">
                {/* Online Admins (Chat Heads) */}
                <div className="flex items-center -space-x-2 mr-2">
                    <AnimatePresence>
                        {activeAdmins.map((admin) => (
                            <motion.div
                                key={admin.uid}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="relative group cursor-pointer"
                                title={`${admin.displayName} (${admin.status})`}
                            >
                                <div className="w-9 h-9 rounded-full border-2 border-white bg-primary-100 overflow-hidden relative">
                                    {admin.photoURL ? (
                                        <Image src={admin.photoURL} alt={admin.displayName} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary-700">
                                            {admin.displayName[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${admin.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                                    }`}></span>

                                {/* Tooltip */}
                                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                    {admin.displayName}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {activeAdmins.length === 0 && (
                        <div className="text-xs text-secondary-400 italic pr-2">No other admins online</div>
                    )}
                </div>

            </div>
        </header>
    );
}

"use client";

import { useState } from "react";
import AnnouncementsManager from "@/components/admin/feed/AnnouncementsManager";
import EventsManager from "@/components/admin/feed/EventsManager";
import { Megaphone, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminFeedPage() {
    const [activeTab, setActiveTab] = useState<'announcements' | 'events'>('announcements');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-secondary-900 font-heading">Announcements, Feed & Events</h1>
                    <p className="text-sm text-secondary-500">Manage community updates and upcoming activities.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-secondary-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                            activeTab === 'announcements'
                                ? "bg-white text-primary-700 shadow-sm"
                                : "text-secondary-600 hover:text-secondary-900"
                        )}
                    >
                        <Megaphone className="w-4 h-4" />
                        Announcements
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                            activeTab === 'events'
                                ? "bg-white text-primary-700 shadow-sm"
                                : "text-secondary-600 hover:text-secondary-900"
                        )}
                    >
                        <Calendar className="w-4 h-4" />
                        Events
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'announcements' ? (
                    <AnnouncementsManager />
                ) : (
                    <EventsManager />
                )}
            </div>
        </div>
    );
}

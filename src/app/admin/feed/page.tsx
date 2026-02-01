"use client";

import { useState, useEffect } from "react";
import { Announcement } from "@/lib/types";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "@/lib/announcements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import { cn } from "@/lib/utils";

export default function AdminFeedPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newType, setNewType] = useState<Announcement['type']>("General");
    const [newPriority, setNewPriority] = useState<Announcement['priority']>("normal");

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        setIsLoading(true);
        const data = await getAnnouncements();
        setAnnouncements(data);
        setIsLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        const success = await createAnnouncement({
            title: newTitle,
            content: newContent,
            type: newType,
            priority: newPriority,
            date: new Date().toISOString() // Or use date picker
        });

        if (success) {
            // Reset form
            setNewTitle("");
            setNewContent("");
            setNewType("General");
            setNewPriority("normal");

            // Reload list
            await loadAnnouncements();
        } else {
            alert("Failed to create announcement.");
        }
        setIsCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this announcement?")) return;

        // Optimistic update
        setAnnouncements(prev => prev.filter(a => a.id !== id));

        const success = await deleteAnnouncement(id);
        if (!success) {
            alert("Failed to delete. Please refresh.");
            loadAnnouncements();
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Urgent': return 'bg-red-100 text-red-700 border-red-200';
            case 'Event': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Fundraising': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-secondary-900 font-heading">Announcements</h1>
                <p className="text-sm text-secondary-500">Manage updates, news, and alerts for the community.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Create Form */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">New Announcement</CardTitle>
                            <CardDescription>Post a new update to the community hub.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-secondary-700">Title</label>
                                    <input
                                        required
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-secondary-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="e.g. Eid Prayer Timings"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-secondary-700">Type & Priority</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={newType}
                                            onChange={(e) => setNewType(e.target.value as any)}
                                            className="flex h-10 w-full rounded-md border border-secondary-300 px-3 py-2 text-sm outline-none"
                                        >
                                            <option value="General">General</option>
                                            <option value="Event">Event</option>
                                            <option value="Urgent">Urgent</option>
                                            <option value="Fundraising">Fundraising</option>
                                        </select>
                                        <select
                                            value={newPriority}
                                            onChange={(e) => setNewPriority(e.target.value as any)}
                                            className="flex h-10 w-full rounded-md border border-secondary-300 px-3 py-2 text-sm outline-none"
                                        >
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-secondary-700">Content</label>
                                    <textarea
                                        required
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                        className="flex min-h-[120px] w-full rounded-md border border-secondary-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                        placeholder="Write your announcement details here..."
                                    />
                                </div>
                                <button
                                    disabled={isCreating}
                                    type="submit"
                                    className="w-full flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-md font-medium transition-colors disabled:opacity-70"
                                >
                                    {isCreating ? 'Posting...' : <><Plus className="w-4 h-4" /> Post Announcement</>}
                                </button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10 text-secondary-500">Loading announcements...</div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-10 text-secondary-400 bg-white rounded-xl border border-dashed border-secondary-200">
                            <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p>No announcements yet.</p>
                        </div>
                    ) : (
                        announcements.map((item) => (
                            <AnimationWrapper key={item.id} animation="fadeIn">
                                <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow flex gap-4">
                                    <div className={cn("p-3 rounded-full h-fit", getTypeColor(item.type))}>
                                        <Megaphone className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-secondary-900">{item.title}</h3>
                                                <div className="flex items-center gap-2 text-xs text-secondary-500 mt-1">
                                                    <span className={cn("px-2 py-0.5 rounded-full border bg-white", getTypeColor(item.type))}>
                                                        {item.type}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-secondary-600 mt-2 line-clamp-3">
                                            {item.content}
                                        </p>
                                    </div>
                                </div>
                            </AnimationWrapper>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

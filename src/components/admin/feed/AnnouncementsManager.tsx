"use client";

import { useState, useEffect } from "react";
import { Announcement } from "@/lib/types";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "@/lib/announcements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/modal"; // Re-using existing Modal component
import { broadcastSMSAction } from "@/app/actions/sms";

export default function AnnouncementsManager() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Success Modal State
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusData, setStatusData] = useState<{ success: boolean; title: string; message: string }>({
        success: true,
        title: "",
        message: ""
    });

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);

    // Form State
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newType, setNewType] = useState<Announcement['type']>("General");
    const [newPriority, setNewPriority] = useState<Announcement['priority']>("normal");
    const [externalUrl, setExternalUrl] = useState("");
    const [sendSMS, setSendSMS] = useState(false);

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

        // 1. Create Announcement in Firestore
        const success = await createAnnouncement({
            title: newTitle,
            content: newContent,
            type: newType,
            priority: newPriority,
            externalUrl: externalUrl,
            date: new Date().toISOString()
        });

        if (success) {
            // 2. Broadcast SMS if enabled
            if (sendSMS) {
                try {
                    // Shorten message for SMS to save cost/segments if needed
                    const smsMessage = `[Masjid Update] ${newTitle}: ${newContent.substring(0, 100)}${newContent.length > 100 ? '...' : ''}`;

                    const data = await broadcastSMSAction(smsMessage);

                    if (data.success) {
                        setStatusData({
                            success: true,
                            title: "Announcement Posted & Broadcasted!",
                            message: `Successfully sent SMS to ${data.sent} subscribers.`
                        });
                    } else {
                        setStatusData({
                            success: true, // Announcement still successful, just SMS failed
                            title: "Posted with SMS Error",
                            message: `Announcement created, but SMS failed: ${data.error || 'Unknown error'}`
                        });
                    }
                } catch (err) {
                    console.error("SMS Broadcast Error:", err);
                    setStatusData({
                        success: true,
                        title: "Posted with SMS Error",
                        message: "Announcement created, but SMS broadcast failed to send."
                    });
                }
            } else {
                // Success without SMS
                setStatusData({
                    success: true,
                    title: "Announcement Posted",
                    message: "Your announcement has been successfully published."
                });
            }

            setShowStatusModal(true);

            // Reload list
            await loadAnnouncements();

            // Reset form
            setNewTitle("");
            setNewContent("");
            setNewType("General");
            setNewPriority("normal");
            setExternalUrl("");
            setSendSMS(false);

        } else {
            setStatusData({
                success: false,
                title: "Creation Failed",
                message: "Failed to create announcement. Please try again."
            });
            setShowStatusModal(true);
        }
        setIsCreating(false);
    };

    const handleDelete = (id: string) => {
        setAnnouncementToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!announcementToDelete) return;

        // Optimistic update
        const id = announcementToDelete;
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        setIsDeleteModalOpen(false);

        const success = await deleteAnnouncement(id);
        if (!success) {
            alert("Failed to delete. Please refresh.");
            loadAnnouncements();
        }
        setAnnouncementToDelete(null);
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
            case 'Event': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
            case 'Fundraising': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
            default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Create Form */}
                <div className="lg:col-span-1">
                    <Card className="bg-white dark:bg-secondary-900 border-none ring-1 ring-secondary-200 dark:ring-secondary-800 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-secondary-900 dark:text-white">New Announcement</CardTitle>
                            <CardDescription className="text-secondary-900 dark:text-secondary-200 font-medium">Post a new update to the community hub.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-secondary-900 dark:text-secondary-200">Title</label>
                                    <input
                                        required
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="flex h-11 w-full rounded-md border text-base focus:ring-2 focus:ring-primary-500 outline-none transition-all px-4 bg-secondary-50 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100"
                                        placeholder="e.g. Eid Prayer Timings"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-secondary-900 dark:text-secondary-200">Type & Priority</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={newType}
                                            onChange={(e) => setNewType(e.target.value as any)}
                                            className="flex h-11 w-full rounded-md border text-sm outline-none px-3 bg-secondary-50 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100"
                                        >
                                            <option value="General">General</option>
                                            <option value="Urgent">Urgent</option>
                                            <option value="Fundraising">Fundraising</option>
                                        </select>
                                        <select
                                            value={newPriority}
                                            onChange={(e) => setNewPriority(e.target.value as any)}
                                            className="flex h-11 w-full rounded-md border text-sm outline-none px-3 bg-secondary-50 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100"
                                        >
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-secondary-900 dark:text-secondary-200">Content</label>
                                    <textarea
                                        required
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                        className="flex min-h-[140px] w-full rounded-md border text-base focus:ring-2 focus:ring-primary-500 outline-none resize-none transition-all p-4 bg-secondary-50 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100"
                                        placeholder="Write your announcement details here..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-secondary-900 dark:text-secondary-200">Facebook Post URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={externalUrl}
                                        onChange={(e) => setExternalUrl(e.target.value)}
                                        className="flex h-11 w-full rounded-md border text-base focus:ring-2 focus:ring-primary-500 outline-none transition-all px-4 bg-secondary-50 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100"
                                        placeholder="https://www.facebook.com/..."
                                    />
                                    <p className="text-[10px] font-medium text-secondary-900 dark:text-secondary-200">If linked, this post will be embedded instead of the text above.</p>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg border bg-secondary-50 border-secondary-200 dark:bg-secondary-800/50 dark:border-secondary-700">
                                    <input
                                        type="checkbox"
                                        id="sms-broadcast"
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 bg-secondary-700 border-secondary-600 dark:bg-white dark:border-secondary-300"
                                        checked={sendSMS}
                                        onChange={(e) => setSendSMS(e.target.checked)}
                                    />
                                    <label htmlFor="sms-broadcast" className="text-sm font-bold select-none cursor-pointer flex items-center gap-2 text-secondary-900 dark:text-white">
                                        <Megaphone className="w-4 h-4 text-secondary-900 dark:text-white" />
                                        Broadcast via SMS
                                    </label>
                                </div>

                                <button
                                    disabled={isCreating}
                                    type="submit"
                                    className="w-full flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-md font-medium transition-colors disabled:opacity-70"
                                >
                                    {isCreating ? 'Posting...' : <><Plus className="w-4 h-4" /> Post {sendSMS ? '& Broadcast' : 'Announcement'}</>}
                                </button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10 text-secondary-900 dark:text-secondary-200 font-bold">Loading announcements...</div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-10 font-medium text-secondary-900 dark:text-secondary-200 bg-white dark:bg-secondary-900 rounded-xl border border-dashed border-secondary-200 dark:border-secondary-800">
                            <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p>No announcements yet.</p>
                        </div>
                    ) : (
                        announcements.map((item) => (
                            <AnimationWrapper key={item.id} animation="fadeIn">
                                <div className="p-6 rounded-3xl border-none ring-1 ring-secondary-200 dark:ring-secondary-800 hover:shadow-xl transition-all duration-300 flex gap-5 bg-white dark:bg-secondary-900 group">
                                    <div className={cn("p-3 rounded-full h-fit", getTypeColor(item.type))}>
                                        <Megaphone className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-secondary-900 dark:text-secondary-100">{item.title}</h3>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-secondary-900 dark:text-secondary-200 mt-1">
                                                    <span className={cn("px-2 py-0.5 rounded-full border bg-secondary-50 dark:bg-secondary-800", getTypeColor(item.type))}>
                                                        {item.type}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-secondary-900 dark:text-secondary-200 font-medium mt-2 line-clamp-3">
                                            {item.content}
                                        </p>
                                    </div>
                                </div>
                            </AnimationWrapper>
                        ))
                    )}
                </div>
            </div>
            {/* Status Modal */}
            <Modal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                title={statusData.title}
            >
                <div className="flex flex-col items-center justify-center text-center py-4 bg-white dark:bg-secondary-900 transition-colors">
                    {statusData.success ? (
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                    )}

                    <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">{statusData.title}</h3>
                    <p className="text-secondary-900 dark:text-secondary-200 font-bold mb-6">{statusData.message}</p>

                    <button
                        onClick={() => setShowStatusModal(false)}
                        className="bg-primary-600 dark:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 dark:hover:bg-primary-800 transition-colors w-full"
                    >
                        Okay, Got it
                    </button>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Announcement"
                className="max-w-sm"
            >
                <div className="flex flex-col items-center justify-center text-center py-4 bg-white dark:bg-secondary-900 transition-colors">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">Are you sure?</h3>
                    <p className="text-secondary-900 dark:text-secondary-200 font-bold mb-6">
                        This action cannot be undone. This announcement will be permanently removed from the website.
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 font-medium rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white font-medium rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors shadow-sm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Event } from "@/lib/types";
import { resizeImage, imageToBase64 } from "@/lib/image-utils";
import { ArrowLeft, Save, Upload, Loader2, Users, FileText } from "lucide-react";
import Link from "next/link";
import EventAttendanceManager from "@/components/admin/events/EventAttendanceManager";
import { useAdmin } from "@/contexts/AdminContext";
import { cn } from "@/lib/utils";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAdmin();
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'attendance'>('details');

    // Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<Event>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        const docRef = doc(db, "events", id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as Event;
                setEvent(data);
                // Only set form data on initial load to avoid overwriting user edits
                setFormData(prev => Object.keys(prev).length === 0 ? data : prev);
                if (data.imageUrl && !imagePreview) setImagePreview(data.imageUrl);
            } else {
                router.push("/admin/events");
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error listening to event:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [id, router]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Generate preview immediately
            setImagePreview(URL.createObjectURL(file));

            try {
                // Resize image before setting to state
                console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
                const resizedBlob = await resizeImage(file, 1200, 0.8);
                console.log(`Resized size: ${(resizedBlob.size / 1024 / 1024).toFixed(2)} MB`);

                const resizedFile = new File([resizedBlob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                });
                setImageFile(resizedFile);
            } catch (error) {
                console.error("Error resizing image:", error);
                setImageFile(file);
            }
        }
    };

    const handleInputChange = (field: keyof Event, value: Event[keyof Event]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let imageUrl = formData.imageUrl;
            if (imageFile) {
                console.log("Converting image to Base64...");
                imageUrl = await imageToBase64(imageFile);
                console.log(`Image converted: ${((imageUrl?.length || 0) / 1024).toFixed(1)} KB`);
            }

            const updates = {
                ...formData,
                imageUrl,
                // Ensure number types
                capacity: formData.capacity ? Number(formData.capacity) : 0,
            };

            await updateDoc(doc(db, "events", id), updates);
            alert("Event updated successfully!");
        } catch (error) {
            console.error("Error updating event:", error);
            alert("Failed to update event.");
        }
        setIsSubmitting(false);
    };

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;
    if (!event) return null;

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link href="/admin/events" className="flex items-center gap-2 text-secondary-500 hover:text-primary-600 font-bold text-sm mb-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Events
                    </Link>
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{event.title}</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-secondary-200 dark:border-secondary-800 mb-8">
                <button
                    onClick={() => setActiveTab('details')}
                    className={cn(
                        "px-4 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2",
                        activeTab === 'details'
                            ? "border-primary-500 text-primary-600 dark:text-primary-400"
                            : "border-transparent text-secondary-500 hover:text-secondary-900 dark:hover:text-white"
                    )}
                >
                    <FileText className="w-4 h-4" /> Event Details
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={cn(
                        "px-4 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2",
                        activeTab === 'attendance'
                            ? "border-primary-500 text-primary-600 dark:text-primary-400"
                            : "border-transparent text-secondary-500 hover:text-secondary-900 dark:hover:text-white"
                    )}
                >
                    <Users className="w-4 h-4" /> Attendance
                </button>
            </div>

            {activeTab === 'details' ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Image Upload Section */}
                    <div className="bg-white dark:bg-secondary-900 p-6 rounded-2xl border border-secondary-200 dark:border-secondary-800 shadow-sm">
                        <label className="block text-sm font-bold text-secondary-900 dark:text-white mb-4">Event Cover Image</label>
                        <div className="relative group w-full h-64 bg-secondary-50 dark:bg-secondary-800 rounded-xl border-2 border-dashed border-secondary-300 dark:border-secondary-700 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />

                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-6">
                                    <Upload className="w-6 h-6 mx-auto mb-2 text-secondary-400" />
                                    <p className="font-bold text-secondary-900 dark:text-white">Upload New Image</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="bg-white dark:bg-secondary-900 p-6 rounded-2xl border border-secondary-200 dark:border-secondary-800 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary-900 dark:text-white">Event Title</label>
                            <input
                                required
                                type="text"
                                value={formData.title || ''}
                                onChange={e => handleInputChange('title', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-secondary-900 dark:text-white">Date</label>
                                <input
                                    required
                                    type="date"
                                    value={formData.date || ''}
                                    onChange={e => handleInputChange('date', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-secondary-900 dark:text-white">Time</label>
                                <input
                                    required
                                    type="time"
                                    value={formData.time || ''}
                                    onChange={e => handleInputChange('time', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary-900 dark:text-white">Location</label>
                            <input
                                required
                                type="text"
                                value={formData.location || ''}
                                onChange={e => handleInputChange('location', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary-900 dark:text-white">Description</label>
                            <textarea
                                required
                                rows={4}
                                value={formData.description || ''}
                                onChange={e => handleInputChange('description', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-secondary-900 dark:text-white">Category</label>
                                <select
                                    value={formData.category || 'General'}
                                    onChange={e => handleInputChange('category', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                >
                                    <option value="General">General</option>
                                    <option value="Religious">Religious</option>
                                    <option value="Community">Community</option>
                                    <option value="Education">Education</option>
                                    <option value="Fundraising">Fundraising</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-secondary-900 dark:text-white">Capacity</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.capacity || 0}
                                    onChange={e => handleInputChange('capacity', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="registrationOpen"
                                checked={formData.registrationOpen || false}
                                onChange={e => handleInputChange('registrationOpen', e.target.checked)}
                                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <label htmlFor="registrationOpen" className="text-sm font-bold text-secondary-900 dark:text-white select-none">
                                Registration Open
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            ) : (
                <EventAttendanceManager event={event} adminUid={user?.uid || 'admin'} />
            )}
        </div>
    );
}

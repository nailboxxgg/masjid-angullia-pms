"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/lib/events";
import { uploadImage } from "@/lib/storage";
import { ArrowLeft, Save, Upload, Calendar, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/modal";
import { AnimatePresence } from "framer-motion";

export default function NewEventPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    // Start Time State
    const [startHour, setStartHour] = useState("08");
    const [startMin, setStartMin] = useState("00");
    const [startAmPm, setStartAmPm] = useState("AM");

    // End Time State
    const [endHour, setEndHour] = useState("05");
    const [endMin, setEndMin] = useState("00");
    const [endAmPm, setEndAmPm] = useState("PM");

    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [capacity, setCapacity] = useState("");
    const [category, setCategory] = useState("General");
    const [registrationOpen, setRegistrationOpen] = useState(true);

    // Image State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            console.log("Starting event creation...");

            // Validate Date
            if (!date) {
                setErrorMsg("Please select a date.");
                setIsSubmitting(false);
                return;
            }

            // Format Date String to MM/DD/YY
            const [year, month, day] = date.split('-');
            if (!year || !month || !day) {
                setErrorMsg("Invalid date format.");
                setIsSubmitting(false);
                return;
            }

            // Time Validation
            const convertToMinutes = (h: string, m: string, ampm: string) => {
                let hour = parseInt(h);
                if (ampm === "PM" && hour !== 12) hour += 12;
                if (ampm === "AM" && hour === 12) hour = 0;
                return hour * 60 + parseInt(m);
            };

            const startMinutes = convertToMinutes(startHour, startMin, startAmPm);
            const endMinutes = convertToMinutes(endHour, endMin, endAmPm);

            if (endMinutes <= startMinutes) {
                setErrorMsg("End time must be after start time.");
                setIsSubmitting(false);
                return;
            }
            const formattedDate = `${month}/${day}/${year.slice(2)}`;

            // Format Time String
            const formattedTime = `${startHour}:${startMin} ${startAmPm} - ${endHour}:${endMin} ${endAmPm}`;

            let imageUrl = "";
            if (imageFile) {
                console.log("Uploading image...");
                try {
                    imageUrl = await uploadImage(imageFile, "events");
                    console.log("Image uploaded:", imageUrl);
                } catch (imgError) {
                    console.error("Image upload failed:", imgError);
                    setErrorMsg("Failed to upload image. Please try again or skip the image.");
                    setIsSubmitting(false);
                    return;
                }
            }

            const eventData = {
                title,
                date: formattedDate,
                time: formattedTime,
                location,
                description,
                category,
                registrationOpen,
                capacity: capacity ? parseInt(capacity) : 0,
                imageUrl,
                createdAt: Date.now()
            };

            console.log("Submitting event data:", eventData);
            const id = await createEvent(eventData);

            if (id) {
                console.log("Event created with ID:", id);
                router.push("/admin/events");
            } else {
                console.error("createEvent returned null");
                setErrorMsg("Failed to create event. Please check your connection.");
            }
        } catch (error) {
            console.error("Error creating event:", error);
            setErrorMsg("An error occurred while creating the event.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="mb-6">
                <Link href="/admin/events" className="flex items-center gap-2 text-secondary-500 hover:text-primary-600 font-bold text-sm mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Events
                </Link>
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Create New Event</h1>
                <p className="text-secondary-500">Fill in the details to publish a new event.</p>
            </div>

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
                            <div className="relative w-full h-full">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setImageFile(null);
                                        setImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-12 h-12 bg-secondary-200 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-3 text-secondary-500 dark:text-secondary-400">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-secondary-900 dark:text-white">Click to upload image</p>
                                <p className="text-sm text-secondary-500">SVG, PNG, JPG or GIF (max. 5MB)</p>
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
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Annual Community Iftar"
                            className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary-900 dark:text-white">Date</label>
                        <input
                            required
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Start Time */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary-900 dark:text-white">Start Time</label>
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={startHour}
                                    onChange={(e) => setStartHour(e.target.value)}
                                    className="flex-1 min-w-[80px] px-3 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                        <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                                <span className="text-secondary-400 font-bold">:</span>
                                <select
                                    value={startMin}
                                    onChange={(e) => setStartMin(e.target.value)}
                                    className="flex-1 min-w-[80px] px-3 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                >
                                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={startAmPm}
                                    onChange={(e) => setStartAmPm(e.target.value)}
                                    className="w-20 px-3 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all uppercase font-bold"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>

                        {/* End Time */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary-900 dark:text-white">End Time</label>
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={endHour}
                                    onChange={(e) => setEndHour(e.target.value)}
                                    className="flex-1 min-w-[80px] px-3 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                        <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                                <span className="text-secondary-400 font-bold">:</span>
                                <select
                                    value={endMin}
                                    onChange={(e) => setEndMin(e.target.value)}
                                    className="flex-1 min-w-[80px] px-3 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                >
                                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={endAmPm}
                                    onChange={(e) => setEndAmPm(e.target.value)}
                                    className="w-20 px-3 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all uppercase font-bold"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary-900 dark:text-white">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                            <input
                                required
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g. Main Prayer Hall"
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary-900 dark:text-white">Description</label>
                        <textarea
                            required
                            rows={4}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the event details..."
                            className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary-900 dark:text-white">Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
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
                            <label className="text-sm font-bold text-secondary-900 dark:text-white">Capacity (0 for unlimited)</label>
                            <input
                                type="number"
                                min="0"
                                value={capacity}
                                onChange={e => setCapacity(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="registrationOpen"
                            checked={registrationOpen}
                            onChange={e => setRegistrationOpen(e.target.checked)}
                            className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label htmlFor="registrationOpen" className="text-sm font-bold text-secondary-900 dark:text-white select-none">
                            Registration Open
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link
                        href="/admin/events"
                        className="px-6 py-3 rounded-xl font-bold text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSubmitting ? "Creating..." : "Create Event"}
                    </button>
                </div>
            </form>

            <AnimatePresence>
                {errorMsg && (
                    <Modal
                        isOpen={!!errorMsg}
                        onClose={() => setErrorMsg(null)}
                        title="Submission Error"
                        className="max-w-sm"
                    >
                        <div className="p-4 pt-2">
                            <p className="text-secondary-600 dark:text-secondary-300 mb-6">{errorMsg}</p>
                            <button
                                onClick={() => setErrorMsg(null)}
                                className="w-full py-3 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-xl font-bold"
                            >
                                Okay
                            </button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}

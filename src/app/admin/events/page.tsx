
"use client";

import { useState, useEffect } from "react";
import { Event } from "@/lib/types";
import { getEvents, createEvent, updateEvent, deleteEvent, getRegistrants, Registrant } from "@/lib/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { Calendar, MapPin, Clock, Users, Plus, Edit2, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Event>>({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        capacity: 100,
        registrationOpen: true
    });
    const [editId, setEditId] = useState<string | null>(null);

    const [viewRegistrantsOpen, setViewRegistrantsOpen] = useState(false);
    const [registrants, setRegistrants] = useState<Registrant[]>([]);
    const [viewEventTitle, setViewEventTitle] = useState("");

    const loadEvents = async () => {
        setIsLoading(true);
        const data = await getEvents();
        setEvents(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            date: "",
            time: "",
            location: "",
            capacity: 100,
            registrationOpen: true
        });
        setEditId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (event: Event) => {
        setFormData({ ...event });
        setEditId(event.id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this event? This cannot be undone.")) {
            setIsDeleting(id);
            await deleteEvent(id);
            await loadEvents();
            setIsDeleting(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editId) {
            await updateEvent(editId, formData);
        } else {
            await createEvent(formData as any);
        }

        await loadEvents();
        resetForm();
    };

    const handleViewRegistrants = async (event: Event) => {
        setViewEventTitle(event.title);
        setViewRegistrantsOpen(true);
        // Optimistically show empty or loading state could be better, but simple for now
        setRegistrants([]);
        const data = await getRegistrants(event.id);
        setRegistrants(data);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-secondary-900 font-heading">Event Management</h1>
                    <p className="text-sm text-secondary-500">Plan and manage community activities.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsFormOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Create Event
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {events.map((event) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="h-full hover:shadow-md transition-all border-secondary-200 group relative">
                                <CardHeader className="pb-2">
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-1.5 text-secondary-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            {isDeleting === event.id ? (
                                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    <div className={`text-xs font-semibold px-2 py-1 rounded w-fit ${event.registrationOpen ? "bg-green-100 text-green-700" : "bg-secondary-100 text-secondary-500"
                                        }`}>
                                        {event.registrationOpen ? "Open" : "Closed"}
                                    </div>
                                    <CardTitle className="text-lg font-heading leading-tight mt-2">{event.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-secondary-500 line-clamp-2">{event.description}</p>

                                    <div className="space-y-2 text-sm text-secondary-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-secondary-400" />
                                            {event.date}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-secondary-400" />
                                            {event.time}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-secondary-400" />
                                            {event.location}
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-secondary-100 mt-3">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-primary-500" />
                                                <span className="font-medium text-secondary-900">{(event.registrantsCount || 0)}</span>
                                                <span className="text-secondary-400">/{event.capacity}</span>
                                            </div>
                                            {(event.registrantsCount || 0) > 0 && (
                                                <button
                                                    onClick={() => handleViewRegistrants(event)}
                                                    className="text-xs text-primary-600 hover:text-primary-800 hover:underline font-medium"
                                                >
                                                    View List
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {events.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-secondary-300">
                        <Calendar className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-secondary-900">No events found</h3>
                        <p className="text-secondary-500 mb-6">Get started by creating your first event.</p>
                        <button
                            onClick={() => { resetForm(); setIsFormOpen(true); }}
                            className="px-4 py-2 bg-secondary-100 text-secondary-700 rounded-md text-sm font-medium hover:bg-secondary-200 transition-colors"
                        >
                            Create Event
                        </button>
                    </div>
                )}
            </div>

            {/* Event Form Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editId ? "Edit Event" : "Create New Event"}
                className="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Event Title</label>
                            <input
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., Annual Iftar Gathering"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full h-24 px-3 py-2 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                placeholder="Details about this event..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Time</label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Location</label>
                            <input
                                required
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., Main Prayer Hall"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Capacity</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                className="w-full h-10 px-3 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="col-span-2 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="regOpen"
                                checked={formData.registrationOpen}
                                onChange={(e) => setFormData({ ...formData, registrationOpen: e.target.checked })}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                            />
                            <label htmlFor="regOpen" className="text-sm font-medium text-secondary-700">Registration Open</label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        >
                            {editId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {editId ? "Save Changes" : "Create Event"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Registrants Modal */}
            <Modal
                isOpen={viewRegistrantsOpen}
                onClose={() => setViewRegistrantsOpen(false)}
                title={`Registrants: ${viewEventTitle}`}
                className="max-w-3xl"
            >
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary-50 text-secondary-600 font-medium border-b border-secondary-200">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Contact</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Registered At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {registrants.length > 0 ? (
                                registrants.map((reg) => (
                                    <tr key={reg.id}>
                                        <td className="px-4 py-3 font-medium text-secondary-900">{reg.name}</td>
                                        <td className="px-4 py-3 text-secondary-600">{reg.contactNumber}</td>
                                        <td className="px-4 py-3 text-secondary-600">{reg.email || "-"}</td>
                                        <td className="px-4 py-3 text-secondary-500 text-xs">
                                            {new Date(reg.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-secondary-500 italic">
                                        No registrants found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end pt-4 border-t border-secondary-100 mt-4">
                    <button
                        onClick={() => setViewRegistrantsOpen(false)}
                        className="px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg text-sm font-medium hover:bg-secondary-200"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    );
}

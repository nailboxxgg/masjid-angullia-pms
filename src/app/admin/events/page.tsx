"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getEvents, deleteEvent } from "@/lib/events";
import { Event } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Plus, Search, MapPin, Users, Edit, Trash2, MoreVertical, Eye } from "lucide-react";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import { cn } from "@/lib/utils";

export default function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const loadEvents = async () => {
        setIsLoading(true);
        const data = await getEvents(50); // Fetch more for admin
        setEvents(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link click
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this event? This cannot be undone.")) {
            // Optimistic update
            setEvents(prev => prev.filter(event => event.id !== id));
            await deleteEvent(id);
        }
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white uppercase tracking-tighter">Events Management</h1>
                    <p className="text-secondary-900 dark:text-secondary-200 mt-1 font-medium italic">Create and manage community events and attendance.</p>
                </div>
                <Link
                    href="/admin/events/new"
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary-600/20"
                >
                    <Plus className="w-5 h-5" />
                    Create Event
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                />
            </div>

            {/* Events Grid */}
            {isLoading ? (
                <div className="text-center py-20 text-secondary-500">Loading events...</div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-secondary-900 rounded-3xl border border-dashed border-secondary-200 dark:border-secondary-800">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-secondary-200" />
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white">No events found</h3>
                    <p className="text-secondary-500 mt-2">Create your first event to get started.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event, index) => (
                        <AnimationWrapper key={event.id} animation="fadeIn" delay={index * 0.05}>
                            <Link href={`/admin/events/${event.id}`} className="group block h-full">
                                <article className="h-full bg-white dark:bg-secondary-900 rounded-2xl overflow-hidden border border-secondary-200 dark:border-secondary-800 hover:border-primary-500/50 hover:shadow-xl transition-all duration-300 flex flex-col">
                                    {/* Image or Placeholder */}
                                    <div className="h-48 bg-secondary-100 dark:bg-secondary-800 relative overflow-hidden">
                                        {event.imageUrl ? (
                                            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-secondary-300">
                                                <Calendar className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            <span className={cn(
                                                "px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md",
                                                event.registrationOpen
                                                    ? "bg-green-500/90 text-white"
                                                    : "bg-secondary-900/90 text-white"
                                            )}>
                                                {event.registrationOpen ? "Open" : "Closed"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className="font-bold text-lg text-secondary-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {event.title}
                                            </h3>
                                        </div>

                                        <div className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400 mb-4 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-primary-500" />
                                                <span>{new Date(event.date).toLocaleDateString()} • {event.time}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-primary-500" />
                                                <span className="line-clamp-1">{event.location}</span>
                                            </div>
                                            {event.capacity && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-primary-500" />
                                                    <span>{event.registrantsCount || 0} / {event.capacity} Registered</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-between mt-auto">
                                            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                                                Manage Event <Eye className="w-3 h-3" />
                                            </span>
                                            <button
                                                onClick={(e) => handleDelete(event.id, e)}
                                                className="p-2 text-secondary-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                title="Delete Event"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        </AnimationWrapper>
                    ))}
                </div>
            )}
        </div>
    );
}

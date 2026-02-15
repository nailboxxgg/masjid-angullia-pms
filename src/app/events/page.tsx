"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Calendar, Clock, MapPin, Users, ArrowLeft, Heart, Sparkles } from "lucide-react";
import { getEvents } from "@/lib/events";
import { Event } from "@/lib/types";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import Link from "next/link";
import EventRegistrationModal from "@/components/events/EventRegistrationModal";

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            const data = await getEvents(30);
            setEvents(data || []);
            setIsLoading(false);
        };
        fetchEvents();
    }, []);

    const handleRegister = (event: Event) => {
        setSelectedEvent(event);
        setIsRegistrationOpen(true);
    };

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col transition-colors duration-300">
            {/* Header Area */}
            <div className="bg-white dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-bold text-sm"
                    >
                        <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden xs:inline">Back</span>
                    </Link>
                    <h1 className="text-base md:text-xl font-bold font-heading text-secondary-900 dark:text-white truncate px-2">Upcoming Events</h1>
                    <div className="w-10 md:w-12 shrink-0" />
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-12">
                <div className="mb-12">
                    <AnimationWrapper animation="reveal" duration={0.8}>
                        <div className="max-w-2xl">
                            <span className="text-primary-600 dark:text-primary-400 font-bold tracking-widest text-xs uppercase mb-2 block">Our Calendar</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white font-heading tracking-tight leading-tight">Events & Activities</h2>
                            <p className="text-secondary-600 dark:text-secondary-400 mt-4 text-lg">
                                Join us in our community gatherings, educational sessions, and spiritual activities.
                            </p>
                        </div>
                    </AnimationWrapper>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-secondary-900 rounded-3xl p-6 shadow-sm animate-pulse h-96" />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-24 bg-white dark:bg-secondary-900 rounded-[2.5rem] border border-dashed border-secondary-200 dark:border-secondary-800">
                        <Calendar className="w-16 h-16 text-secondary-200 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">No Upcoming Events</h3>
                        <p className="text-secondary-500">Check back later for new activities and updates.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event, idx) => (
                            <AnimationWrapper key={event.id} animation="reveal" delay={idx * 0.1} withScroll>
                                <div className="group bg-white dark:bg-secondary-900 rounded-3xl overflow-hidden border border-secondary-100 dark:border-secondary-800 hover:border-primary-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10 flex flex-col h-full">
                                    <div className="relative h-56 overflow-hidden">
                                        <Image
                                            src={event.imageUrl || "/images/mosque2.png"}
                                            alt={event.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/20">
                                                {event.category || "General"}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <h3 className="text-xl font-bold text-white leading-tight line-clamp-2">{event.title}</h3>
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3 text-secondary-500 dark:text-secondary-400 text-sm font-medium">
                                                <Calendar className="w-4 h-4 text-primary-500" />
                                                <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-secondary-500 dark:text-secondary-400 text-sm font-medium">
                                                <Clock className="w-4 h-4 text-primary-500" />
                                                <span>{event.time}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-secondary-500 dark:text-secondary-400 text-sm font-medium">
                                                <MapPin className="w-4 h-4 text-primary-500" />
                                                <span className="line-clamp-1">{event.location}</span>
                                            </div>
                                            {event.capacity && (
                                                <div className="flex items-center gap-3 text-secondary-500 dark:text-secondary-400 text-sm font-medium">
                                                    <Users className="w-4 h-4 text-primary-500" />
                                                    <span>{event.registrantsCount || 0} / {event.capacity} Registered</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-8">
                                            <button
                                                disabled={!event.registrationOpen || !!(event.capacity && (event.registrantsCount || 0) >= event.capacity)}
                                                onClick={() => handleRegister(event)}
                                                className={cn(
                                                    "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                                                    event.registrationOpen && (!event.capacity || (event.registrantsCount || 0) < event.capacity)
                                                        ? "bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                                                        : "bg-secondary-100 dark:bg-secondary-800 text-secondary-400 cursor-not-allowed"
                                                )}
                                            >
                                                {!event.registrationOpen ? "Registration Closed" :
                                                    (event.capacity && (event.registrantsCount || 0) >= event.capacity) ? "Event Full" :
                                                        "Register Now"}
                                                <Sparkles className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </AnimationWrapper>
                        ))}
                    </div>
                )}
            </main>

            <Footer />

            <EventRegistrationModal
                isOpen={isRegistrationOpen}
                onClose={() => setIsRegistrationOpen(false)}
                event={selectedEvent}
            />
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import { getEvents, getRegistrants, updateRegistrantStatus } from "@/lib/events";
import { Event, Registrant } from "@/lib/types";
import { Check, X, Users, Calendar, Search, Loader2, ChevronRight, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimationWrapper from "@/components/ui/AnimationWrapper";

interface RegistrantOverviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RegistrantOverviewModal({ isOpen, onClose }: RegistrantOverviewModalProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [registrants, setRegistrants] = useState<Registrant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const loadEvents = async () => {
            setIsLoading(true);
            const data = await getEvents(50);
            setEvents(data);
            setSelectedEventId(prev => prev || (data.length > 0 ? data[0].id : null));
            setIsLoading(false);
        };

        if (isOpen) {
            loadEvents();
        }
    }, [isOpen]);

    useEffect(() => {
        const loadRegistrants = async (eventId: string) => {
            setIsLoading(true);
            const data = await getRegistrants(eventId);
            setRegistrants(data);
            setIsLoading(false);
        };

        if (selectedEventId) {
            loadRegistrants(selectedEventId);
        }
    }, [selectedEventId]);

    const handleUpdateStatus = async (registrantId: string, status: Registrant['status']) => {
        setIsActionLoading(registrantId);
        const success = await updateRegistrantStatus(registrantId, status);
        if (success) {
            setRegistrants(prev => prev.map(r =>
                r.id === registrantId ? { ...r, status } : r
            ));
        }
        setIsActionLoading(null);
    };

    const selectedEvent = events.find(e => e.id === selectedEventId);

    const filteredRegistrants = registrants.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contactNumber.includes(searchQuery)
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Manage Registrations"
            className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden"
            hideScrollbar={true}
        >
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: Events List */}
                <div className="w-1/3 border-r border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-900/50 flex flex-col">
                    <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
                        <h3 className="text-xs font-black uppercase tracking-widest text-secondary-500">Events</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {events.map((event) => (
                            <button
                                key={event.id}
                                onClick={() => setSelectedEventId(event.id)}
                                className={cn(
                                    "w-full text-left p-4 transition-all flex items-center justify-between group",
                                    selectedEventId === event.id
                                        ? "bg-white dark:bg-secondary-800 border-r-4 border-primary-500 shadow-sm"
                                        : "hover:bg-secondary-100 dark:hover:bg-secondary-800/50"
                                )}
                            >
                                <div className="min-w-0">
                                    <p className={cn(
                                        "font-bold text-sm truncate",
                                        selectedEventId === event.id ? "text-primary-600 dark:text-primary-400" : "text-secondary-900 dark:text-white"
                                    )}>
                                        {event.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Users className="w-3 h-3 text-secondary-400" />
                                        <span className="text-[10px] text-secondary-500 font-medium">{event.registrantsCount || 0} Registered</span>
                                    </div>
                                </div>
                                <ChevronRight className={cn(
                                    "w-4 h-4 transition-transform",
                                    selectedEventId === event.id ? "text-primary-500 translate-x-1" : "text-secondary-300 opacity-0 group-hover:opacity-100"
                                )} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content: Registrants List */}
                <div className="flex-1 flex flex-col bg-white dark:bg-secondary-950">
                    {selectedEvent ? (
                        <>
                            {/* Filter Sub-header */}
                            <div className="p-4 border-b border-secondary-100 dark:border-secondary-800 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-secondary-900 dark:text-white tracking-tight leading-none mb-1 uppercase">
                                            {selectedEvent.title}
                                        </h2>
                                        <div className="flex items-center gap-3 text-xs text-secondary-500 font-medium">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedEvent.date}</span>
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {selectedEvent.registrantsCount || 0} Total</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                        <input
                                            type="text"
                                            placeholder="Filter registrants..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 outline-none w-48 md:w-64 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Registrants Scrolling Area */}
                            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-secondary-200 dark:scrollbar-thumb-secondary-800">
                                {isLoading ? (
                                    <div className="h-full flex flex-col items-center justify-center text-secondary-400">
                                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                        <p className="text-sm font-medium">Loading registrants...</p>
                                    </div>
                                ) : filteredRegistrants.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-secondary-300 text-center py-10">
                                        <Users className="w-12 h-12 mb-4 opacity-10" />
                                        <p className="text-base font-bold">No registrants found</p>
                                        <p className="text-sm">Either no one has registered yet or matches your search.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {filteredRegistrants.map((reg, idx) => (
                                            <AnimationWrapper key={reg.id} animation="fadeIn" delay={idx * 0.05}>
                                                <div className="bg-secondary-50 dark:bg-secondary-900/50 p-4 rounded-2xl border border-secondary-100 dark:border-secondary-800 flex items-center justify-between group hover:border-primary-500/30 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black">
                                                            {reg.name[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-secondary-900 dark:text-white leading-none">{reg.name}</p>
                                                                <span className={cn(
                                                                    "text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                                                    reg.status === 'accepted' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                                        reg.status === 'attended' ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" :
                                                                            reg.status === 'rejected' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                                                "bg-secondary-200 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-400"
                                                                )}>
                                                                    {reg.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-secondary-500 mt-1">{reg.contactNumber} {reg.email ? `• ${reg.email}` : ''}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {reg.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(reg.id, 'accepted')}
                                                                    disabled={isActionLoading === reg.id}
                                                                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                                                                    title="Accept Registration"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(reg.id, 'rejected')}
                                                                    disabled={isActionLoading === reg.id}
                                                                    className="p-2 bg-secondary-200 hover:bg-red-500 hover:text-white dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 rounded-lg transition-all disabled:opacity-50"
                                                                    title="Reject Registration"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {reg.status === 'accepted' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(reg.id, 'attended')}
                                                                disabled={isActionLoading === reg.id}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all text-xs font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5" />
                                                                Mark Attended
                                                            </button>
                                                        )}
                                                        {reg.status === 'attended' && (
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-900/30">
                                                                <Check className="w-3.5 h-3.5" />
                                                                Completed
                                                            </div>
                                                        )}
                                                        {isActionLoading === reg.id && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
                                                    </div>
                                                </div>
                                            </AnimationWrapper>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-secondary-400 p-10 text-center">
                            <Calendar className="w-16 h-16 mb-4 opacity-5" />
                            <h3 className="text-xl font-bold uppercase tracking-tight">Select an Event</h3>
                            <p className="text-sm mt-2 max-w-xs">Select an event from the left to view and manage its registrants.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

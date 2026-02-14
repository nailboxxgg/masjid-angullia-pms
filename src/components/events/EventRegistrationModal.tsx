
"use client";

import { useState } from "react";
import Modal from "@/components/ui/modal";
import { registerForEvent } from "@/lib/events";
import { Loader2, CheckCircle, Calendar, MapPin, Clock } from "lucide-react";
import { Event } from "@/lib/types";
import { normalizePhoneNumber } from "@/lib/utils";

interface EventRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
}

export default function EventRegistrationModal({ isOpen, onClose, event }: EventRegistrationModalProps) {
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;

        setStatus('submitting');
        setErrorMessage("");

        const result = await registerForEvent(event.id, {
            name,
            contactNumber: normalizePhoneNumber(contact),
            email
        });

        if (result.success) {
            setStatus('success');
            // Reset form after delay or on close
        } else {
            setStatus('error');
            setErrorMessage(result.error || "Failed to register. Please try again.");
        }
    };

    const handleClose = () => {
        if (status === 'success') {
            setName("");
            setContact("");
            setEmail("");
            setStatus('idle');
        }
        onClose();
    };

    if (!event) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={status === 'success' ? "Registration Confirmed" : "Register for Event"}
            className="max-w-md"
        >
            {status === 'success' ? (
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-2">You're All Set!</h3>
                    <p className="text-secondary-600 mb-6">
                        You have successfully registered for <strong>{event.title}</strong>.
                    </p>
                    <button
                        onClick={handleClose}
                        className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Event Summary */}
                    <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-100 mb-4">
                        <h4 className="font-bold text-secondary-900 mb-2">{event.title}</h4>
                        <div className="text-xs text-secondary-600 space-y-1">
                            <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {event.date}</div>
                            <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> {event.time}</div>
                            <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {event.location}</div>
                        </div>
                    </div>

                    {status === 'error' && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                            {errorMessage}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Full Name</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            placeholder="Brother / Sister Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Number</label>
                        <input
                            required
                            type="tel"
                            inputMode="numeric"
                            value={contact}
                            onChange={(e) => setContact(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all placeholder:text-secondary-400"
                            placeholder="Enter your mobile number"
                            maxLength={11}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Email (Optional)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            placeholder="email@example.com"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {status === 'submitting' ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                                </>
                            ) : (
                                "Register Now"
                            )}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}

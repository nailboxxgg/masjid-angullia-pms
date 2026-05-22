"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { createMemberServiceRequest, getMemberServiceRequests } from "@/lib/members";
import { MemberServiceRequest } from "@/lib/types";

const requestTypes: MemberServiceRequest["type"][] = [
    "General Inquiry",
    "Religious Service",
    "Facility Booking",
    "Welfare Support",
    "Class Registration",
];

export default function MemberRequestsPage() {
    const { user, profile } = useMember();
    const [requests, setRequests] = useState<MemberServiceRequest[]>([]);
    const [type, setType] = useState<MemberServiceRequest["type"]>("General Inquiry");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

    const loadRequests = async () => {
        if (!user) return;
        const data = await getMemberServiceRequests(user.uid);
        setRequests(data);
    };

    useEffect(() => {
        loadRequests().catch((error) => console.error("Failed to load member requests:", error));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user || !profile) return;

        setStatus("submitting");
        try {
            await createMemberServiceRequest({
                memberId: user.uid,
                memberName: profile.displayName,
                memberEmail: profile.email,
                type,
                subject,
                message,
            });
            setSubject("");
            setMessage("");
            await loadRequests();
            setStatus("success");
            setTimeout(() => setStatus("idle"), 2500);
        } catch (error) {
            console.error("Failed to create member request:", error);
            setStatus("error");
        }
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                <h1 className="text-2xl font-black text-secondary-900 dark:text-white">Requests</h1>
                <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">Submit and track service requests with the masjid team.</p>

                <div className="mt-6 space-y-3">
                    {requests.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-secondary-200 p-8 text-center text-sm font-bold text-secondary-500 dark:border-secondary-800">
                            No requests submitted yet.
                        </div>
                    ) : requests.map((request) => (
                        <div key={request.id} className="rounded-lg border border-secondary-200 p-4 dark:border-secondary-800">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-black text-secondary-900 dark:text-white">{request.subject}</p>
                                    <p className="text-sm text-secondary-500">{request.type}</p>
                                </div>
                                <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300">
                                    {request.status.replace("_", " ")}
                                </span>
                            </div>
                            <p className="mt-3 text-sm text-secondary-600 dark:text-secondary-400">{request.message}</p>
                        </div>
                    ))}
                </div>
            </section>

            <form onSubmit={handleSubmit} className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                <h2 className="text-lg font-black text-secondary-900 dark:text-white">New Request</h2>
                <div className="mt-5 space-y-4">
                    <label className="space-y-2 block">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Type</span>
                        <select value={type} onChange={(e) => setType(e.target.value as MemberServiceRequest["type"])} className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950">
                            {requestTypes.map((requestType) => <option key={requestType}>{requestType}</option>)}
                        </select>
                    </label>
                    <label className="space-y-2 block">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Subject</span>
                        <input required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950" />
                    </label>
                    <label className="space-y-2 block">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-500">Message</span>
                        <textarea required value={message} onChange={(e) => setMessage(e.target.value)} className="h-32 w-full resize-none rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950" />
                    </label>
                    {status === "error" && <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">Request failed. Please try again.</p>}
                    {status === "success" && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">Request submitted.</p>}
                    <button disabled={status === "submitting"} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-black text-white hover:bg-primary-700 disabled:opacity-60">
                        <Send className="h-4 w-4" />
                        {status === "submitting" ? "Submitting..." : "Submit Request"}
                    </button>
                </div>
            </form>
        </div>
    );
}

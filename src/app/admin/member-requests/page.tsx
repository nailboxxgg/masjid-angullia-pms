"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, MessageSquareReply, RefreshCw, Search } from "lucide-react";
import { getAllMemberServiceRequests, updateMemberServiceRequest } from "@/lib/member-requests-admin";
import { MemberServiceRequest } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";

const statuses: MemberServiceRequest["status"][] = ["pending", "in_review", "resolved", "cancelled"];

const statusLabels: Record<MemberServiceRequest["status"], string> = {
    pending: "Pending",
    in_review: "In Review",
    resolved: "Resolved",
    cancelled: "Cancelled",
};

const statusStyles: Record<MemberServiceRequest["status"], string> = {
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    in_review: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    resolved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    cancelled: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
};

export default function AdminMemberRequestsPage() {
    const [requests, setRequests] = useState<MemberServiceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<MemberServiceRequest["status"] | "all">("all");
    const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
    const [draftStatuses, setDraftStatuses] = useState<Record<string, MemberServiceRequest["status"]>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const loadRequests = async () => {
        setIsLoading(true);
        setError("");
        try {
            const data = await getAllMemberServiceRequests();
            setRequests(data);
            setDraftReplies(Object.fromEntries(data.map((request) => [request.id, request.adminReply || ""])));
            setDraftStatuses(Object.fromEntries(data.map((request) => [request.id, request.status])));
        } catch (loadError) {
            console.error("Failed to load member requests:", loadError);
            setError("Failed to load member requests.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const filteredRequests = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        return requests.filter((request) => {
            const matchesStatus = statusFilter === "all" || request.status === statusFilter;
            const matchesSearch = !search ||
                request.memberName.toLowerCase().includes(search) ||
                request.memberEmail.toLowerCase().includes(search) ||
                request.subject.toLowerCase().includes(search) ||
                request.type.toLowerCase().includes(search);

            return matchesStatus && matchesSearch;
        });
    }, [requests, searchTerm, statusFilter]);

    const handleSave = async (request: MemberServiceRequest) => {
        setSavingId(request.id);
        setError("");

        try {
            await updateMemberServiceRequest(request.id, {
                status: draftStatuses[request.id] || request.status,
                adminReply: draftReplies[request.id] || "",
            });
            await loadRequests();
        } catch (saveError) {
            console.error("Failed to update member request:", saveError);
            setError("Failed to save request update.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-secondary-900 dark:text-white">Member Requests</h1>
                    <p className="mt-1 text-secondary-500 dark:text-secondary-400">Review member service requests, update their status, and reply directly.</p>
                </div>
                <button
                    type="button"
                    onClick={loadRequests}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary-900 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-black dark:bg-white dark:text-secondary-900"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-xl border border-secondary-200 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-primary-500 dark:border-secondary-800 dark:bg-secondary-900"
                        placeholder="Search by member, email, type, or subject"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as MemberServiceRequest["status"] | "all")}
                    className="rounded-xl border border-secondary-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-primary-500 dark:border-secondary-800 dark:bg-secondary-900"
                >
                    <option value="all">All Statuses</option>
                    {statuses.map((status) => (
                        <option key={status} value={status}>{statusLabels[status]}</option>
                    ))}
                </select>
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600 dark:bg-red-950/30 dark:text-red-300">{error}</p>}

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-52 animate-pulse rounded-2xl bg-white dark:bg-secondary-900" />
                    ))}
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-secondary-200 bg-white p-12 text-center dark:border-secondary-800 dark:bg-secondary-900">
                    <MessageSquareReply className="mx-auto h-10 w-10 text-secondary-300" />
                    <p className="mt-3 font-bold text-secondary-600 dark:text-secondary-300">No member requests found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.map((request) => (
                        <section key={request.id} className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${statusStyles[request.status]}`}>
                                            {statusLabels[request.status]}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary-400">
                                            <Clock className="h-3 w-3" />
                                            {formatTimeAgo(request.createdAt)}
                                        </span>
                                    </div>
                                    <h2 className="mt-3 text-xl font-black text-secondary-900 dark:text-white">{request.subject}</h2>
                                    <p className="mt-1 text-sm font-bold text-primary-600 dark:text-primary-400">{request.type}</p>
                                    <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
                                        {request.memberName} · {request.memberEmail}
                                    </p>
                                    <p className="mt-4 whitespace-pre-wrap rounded-xl bg-secondary-50 p-4 text-sm font-medium text-secondary-700 dark:bg-secondary-950 dark:text-secondary-300">
                                        {request.message}
                                    </p>
                                </div>

                                <div className="w-full space-y-3 lg:max-w-md">
                                    <label className="block space-y-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-secondary-500">Status</span>
                                        <select
                                            value={draftStatuses[request.id] || request.status}
                                            onChange={(event) => setDraftStatuses((current) => ({ ...current, [request.id]: event.target.value as MemberServiceRequest["status"] }))}
                                            className="w-full rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-bold outline-none focus:border-primary-500 dark:border-secondary-800 dark:bg-secondary-950"
                                        >
                                            {statuses.map((status) => (
                                                <option key={status} value={status}>{statusLabels[status]}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="block space-y-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-secondary-500">Admin Reply</span>
                                        <textarea
                                            value={draftReplies[request.id] || ""}
                                            onChange={(event) => setDraftReplies((current) => ({ ...current, [request.id]: event.target.value }))}
                                            className="h-32 w-full resize-none rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-800 dark:bg-secondary-950"
                                            placeholder="Write an update that the member can see..."
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleSave(request)}
                                        disabled={savingId === request.id}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {savingId === request.id ? "Saving..." : "Save Update"}
                                    </button>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}

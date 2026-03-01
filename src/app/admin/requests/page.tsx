/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock, MapPin, Phone, Users, User, AlertCircle, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { getPendingFamilies, updateFamily, deleteFamily } from "@/lib/families";
import { Family, FamilyMember } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import AnimationWrapper from "@/components/ui/AnimationWrapper";

export default function AdminRequestsPage() {
    const searchParams = useSearchParams();
    const [requests, setRequests] = useState<Family[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject', family: Family } | null>(null);

    const loadRequests = async () => {
        setIsLoading(true);
        const data = await getPendingFamilies();
        setRequests(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const filteredRequests = requests.filter(request =>
        (request.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.head || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const executeAction = async () => {
        if (!confirmAction) return;
        const { type, family } = confirmAction;

        setProcessingId(family.id);

        let success = false;
        if (type === 'approve') {
            success = await updateFamily(family.id, { status: 'active' });
        } else {
            success = await deleteFamily(family.id);
        }

        if (success) {
            setRequests(prev => prev.filter(r => r.id !== family.id));
            setConfirmAction(null);
        } else {
            alert(`Failed to ${type} request.`);
        }
        setProcessingId(null);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-secondary-900 dark:text-white font-heading tracking-tight mb-2">
                        Registration Requests
                    </h1>
                    <p className="text-secondary-500 dark:text-secondary-400 text-lg font-medium">
                        Manage pending family approvals.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border-none font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50 dark:bg-secondary-800/50 backdrop-blur-md text-secondary-900 placeholder:text-secondary-400 dark:text-secondary-100 shadow-sm ring-1 ring-secondary-200 dark:ring-secondary-700 text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold bg-white/50 dark:bg-secondary-800/50 backdrop-blur-md px-6 py-3 rounded-2xl text-secondary-600 dark:text-secondary-300 border border-secondary-100 dark:border-secondary-700 shadow-sm">
                        <Clock className="w-5 h-5" />
                        <span>{filteredRequests.length} Pending</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[400px] bg-white/20 dark:bg-secondary-900/20 rounded-[2rem] animate-pulse" />
                    ))}
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white/40 dark:bg-secondary-900/40 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-secondary-200 dark:border-secondary-800">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/10">
                        <Check className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-secondary-900 dark:text-white mb-2 font-heading">
                        {searchTerm ? "No Matches Found" : "All Caught Up!"}
                    </h3>
                    <p className="text-secondary-500 dark:text-secondary-400 font-medium">
                        {searchTerm ? "Try adjusting your search terms." : "No pending registration requests at the moment."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredRequests.map((request, idx) => (
                        <AnimationWrapper key={request.id} animation="scaleIn" delay={idx * 0.05}>
                            <div className="h-full flex flex-col bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/50 dark:border-secondary-800 shadow-xl shadow-secondary-200/20 dark:shadow-none hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-10 transition-opacity duration-500">
                                    <Users className="w-48 h-48 -mr-10 -mt-10" />
                                </div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    New
                                                </span>
                                                <span suppressHydrationWarning className="text-xs font-semibold text-secondary-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTimeAgo(request.createdAt ?? 0)}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-black text-secondary-900 dark:text-white font-heading leading-tight line-clamp-2">
                                                {request.name}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4 mb-8">
                                        <div className="flex items-start gap-4 p-3 rounded-2xl bg-secondary-50/50 dark:bg-secondary-800/30">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-secondary-800 flex items-center justify-center shrink-0 shadow-sm text-primary-500">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-secondary-400 font-black uppercase tracking-widest mb-0.5">Head of Family</p>
                                                <p className="text-base font-bold text-secondary-800 dark:text-secondary-100">{request.head}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-3 rounded-2xl bg-secondary-50/50 dark:bg-secondary-800/30">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-secondary-800 flex items-center justify-center shrink-0 shadow-sm text-primary-500">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-secondary-400 font-black uppercase tracking-widest mb-0.5">Address</p>
                                                <p className="text-sm font-bold text-secondary-800 dark:text-secondary-100 leading-snug">{request.address}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-3 rounded-2xl bg-secondary-50/50 dark:bg-secondary-800/30">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-secondary-800 flex items-center justify-center shrink-0 shadow-sm text-primary-500">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-secondary-400 font-black uppercase tracking-widest mb-0.5">Contact</p>
                                                <p className="text-base font-bold text-secondary-800 dark:text-secondary-100 font-mono tracking-tight">{request.phone}</p>
                                            </div>
                                        </div>

                                        {Array.isArray(request.members) && request.members.length > 0 && (
                                            <div className="pt-2">
                                                <p className="text-[10px] text-secondary-400 font-black uppercase tracking-widest mb-2 px-1">Family Members ({request.members.length})</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {request.members.map((m: FamilyMember) => (
                                                        <span key={m.id} className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white dark:bg-secondary-800 text-xs font-bold text-secondary-600 dark:text-secondary-300 border border-secondary-100 dark:border-secondary-700 shadow-sm">
                                                            {m.name} <span className="text-secondary-400 font-medium ml-1.5 text-[10px]"> {m.relation}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-6 mt-auto border-t border-secondary-100 dark:border-secondary-800/50">
                                        <button
                                            onClick={() => setConfirmAction({ type: 'reject', family: request })}
                                            className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-all flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" /> Reject
                                        </button>
                                        <button
                                            onClick={() => setConfirmAction({ type: 'approve', family: request })}
                                            className="flex-[2] px-4 py-3.5 rounded-2xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-bold text-sm shadow-xl shadow-secondary-900/10 hover:bg-black dark:hover:bg-secondary-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-4 h-4" /> Approve Registration
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </AnimationWrapper>
                    ))}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => !processingId && setConfirmAction(null)}
                    />
                    <div className="relative w-full max-w-sm bg-white dark:bg-secondary-900 rounded-[2.5rem] p-8 shadow-2xl animate-scale-in border border-white/20">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${confirmAction.type === 'approve'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {confirmAction.type === 'approve' ? <Check className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                        </div>

                        <h3 className="text-2xl font-black text-center text-secondary-900 dark:text-white mb-2 font-heading capitalize">
                            {confirmAction.type} Registration?
                        </h3>
                        <p className="text-center text-secondary-500 dark:text-secondary-400 font-medium mb-8 leading-relaxed">
                            Are you sure you want to <span className="font-bold text-secondary-900 dark:text-white">{confirmAction.type}</span> request from <br />
                            <span className="font-bold text-primary-600 dark:text-primary-400">{confirmAction.family.name}</span>?
                            {confirmAction.type === 'reject' && (
                                <span className="block mt-2 text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                                    ⚠️ This action cannot be undone.
                                </span>
                            )}
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={executeAction}
                                disabled={!!processingId}
                                className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${confirmAction.type === 'approve'
                                    ? 'bg-green-600 hover:bg-green-500 shadow-green-500/20'
                                    : 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                                    }`}
                            >
                                {processingId ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        Confirm <span className="capitalize">{confirmAction.type}</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setConfirmAction(null)}
                                disabled={!!processingId}
                                className="w-full py-4 rounded-2xl font-bold text-secondary-500 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-white hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

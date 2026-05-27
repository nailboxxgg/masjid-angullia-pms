"use client";

import { useEffect, useState } from "react";
import { Users, Search, Loader2, Link as LinkIcon, CheckCircle2, UserCheck, Phone, MapPin } from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { getFamilyById, searchFamilies } from "@/lib/families";
import { createMemberServiceRequest, getMemberServiceRequests } from "@/lib/members";
import { Family, FamilyMember, MemberServiceRequest } from "@/lib/types";

export default function FamilyLinkingPage() {
    const { user, profile } = useMember();
    const [family, setFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Family[]>([]);
    const [searching, setSearching] = useState(false);
    const [requests, setRequests] = useState<MemberServiceRequest[]>([]);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState("");

    const loadFamilyData = async () => {
        if (!user || !profile) return;
        setLoading(true);
        try {
            // Load existing family details if linked
            if (profile.familyId) {
                const familyData = await getFamilyById(profile.familyId);
                setFamily(familyData);
            }
            // Load previous linking requests
            const reqs = await getMemberServiceRequests(user.uid);
            setRequests(reqs.filter(r => r.type === "Family Link"));
        } catch (error) {
            console.error("Failed to load family data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFamilyData();
    }, [user, profile]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const results = await searchFamilies(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error("Error searching registry:", error);
        } finally {
            setSearching(false);
        }
    };

    const handleLinkRequest = async (targetFamily: Family) => {
        if (!user || !profile) return;
        setSubmittingId(targetFamily.id);
        setFeedback("");
        try {
            await createMemberServiceRequest({
                memberId: user.uid,
                memberName: profile.displayName,
                memberEmail: profile.email,
                type: "Family Link",
                subject: `Request to link account to Family: ${targetFamily.name}`,
                message: `Member ${profile.displayName} (UID: ${user.uid}) requested to link their profile to Family Registry Unit: ${targetFamily.name} (Family ID: ${targetFamily.id}, Head: ${targetFamily.head}).`,
            });
            setFeedback("Link request submitted successfully. Awaiting administrator review.");
            await loadFamilyData();
        } catch (error) {
            console.error("Link request failed:", error);
            setFeedback("Failed to submit request. Please try again.");
        } finally {
            setSubmittingId(null);
        }
    };

    const pendingRequest = requests.find(r => r.status === "pending" || r.status === "in_review");

    return (
        <div className="space-y-6">
            <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
                <p className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">Registry</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary-900 dark:text-white">Family Profile Linking</h1>
                <p className="mt-3 max-w-2xl text-secondary-600 dark:text-secondary-400 font-medium">
                    Link your member profile to your family unit to manage household details, coordinate community assistance, and keep details centralized.
                </p>
            </section>

            {loading ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-secondary-200 dark:border-secondary-800 dark:bg-secondary-900">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
            ) : family ? (
                /* Linked Family Card */
                <section className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-secondary-900 dark:text-white">{family.name}</h2>
                            <p className="text-sm font-bold text-secondary-400">Linked Family Registry Unit</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <UserCheck className="h-5 w-5 text-secondary-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Head of Family</p>
                                    <p className="font-bold text-secondary-800 dark:text-secondary-200">{family.head}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-secondary-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Primary Contact Phone</p>
                                    <p className="font-bold text-secondary-800 dark:text-secondary-200">{family.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-secondary-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Family Address</p>
                                    <p className="font-bold text-secondary-800 dark:text-secondary-200">{family.address}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-2">Family Members List</p>
                            {Array.isArray(family.members) ? (
                                <ul className="space-y-2">
                                    {family.members.map((member: FamilyMember) => (
                                        <li key={member.id} className="flex items-center justify-between rounded-lg border border-secondary-100 bg-secondary-50/50 p-3 text-sm dark:border-secondary-800 dark:bg-secondary-950">
                                            <span className="font-bold text-secondary-800 dark:text-secondary-200">{member.name}</span>
                                            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-700 dark:bg-primary-950/30 dark:text-primary-300">
                                                {member.relation}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm font-bold text-secondary-500">{family.members} registered member(s)</p>
                            )}
                        </div>
                    </div>
                </section>
            ) : (
                /* Unlinked Search / Link Form */
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <section className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900 space-y-6">
                        <div className="flex items-center gap-3">
                            <Search className="h-6 w-6 text-secondary-400" />
                            <h2 className="text-xl font-black text-secondary-900 dark:text-white">Search Family Registry</h2>
                        </div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            Search by your family name, primary contact phone, or the name of the head of your family to link your profile.
                        </p>

                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                required
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-700 dark:bg-secondary-950"
                                placeholder="Enter family name, head, or contact phone"
                            />
                            <button disabled={searching} className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-black text-white hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-primary-500/10">
                                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                Search
                            </button>
                        </form>

                        {feedback && (
                            <div className="rounded-lg bg-primary-50 p-3.5 text-sm font-bold text-primary-800 border border-primary-100 flex items-center gap-2 dark:bg-primary-950/20 dark:text-primary-300 dark:border-primary-900/30">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {feedback}
                            </div>
                        )}

                        <div className="space-y-3">
                            {searchResults.length === 0 ? (
                                searchQuery && !searching && (
                                    <div className="rounded-xl border border-dashed border-secondary-200 p-8 text-center text-sm font-bold text-secondary-500 dark:border-secondary-800">
                                        No matching family unit was found.
                                    </div>
                                )
                            ) : (
                                searchResults.map((result) => (
                                    <div key={result.id} className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-800 dark:bg-secondary-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <p className="font-black text-secondary-900 dark:text-white">{result.name}</p>
                                            <p className="text-xs text-secondary-500 mt-1">Head: {result.head} · Phone: {result.phone}</p>
                                            <p className="text-xs text-secondary-500">{result.address}</p>
                                        </div>
                                        <button
                                            disabled={!!pendingRequest || submittingId === result.id}
                                            onClick={() => handleLinkRequest(result)}
                                            className="rounded-lg bg-primary-50 hover:bg-primary-100 border border-primary-200 px-3.5 py-2 text-xs font-black uppercase tracking-widest text-primary-700 flex items-center gap-2 disabled:opacity-50 dark:bg-primary-950/30 dark:text-primary-300 dark:border-primary-900/30"
                                        >
                                            {submittingId === result.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
                                            Request Link
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <section className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm dark:border-secondary-800 dark:bg-secondary-900 space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-secondary-500">Request Status</h3>
                            {pendingRequest ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                                    <p className="font-black uppercase tracking-widest mb-1 text-[10px]">Awaiting Approval</p>
                                    Your request to link with <strong>{pendingRequest.subject.replace("Request to link account to Family: ", "")}</strong> is pending review by the masjid office.
                                </div>
                            ) : (
                                <p className="text-xs text-secondary-500 font-bold">No active family linking requests.</p>
                            )}
                        </section>
                    </aside>
                </div>
            )}
        </div>
    );
}

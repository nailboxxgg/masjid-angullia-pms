"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Ban,
    Clock,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Search,
    ShieldCheck,
    UserCheck,
    UserCog,
    Users as UsersIcon,
} from "lucide-react";
import { countMembersByStatus, listMembers, setMembershipStatus } from "@/lib/members-admin";
import { MemberProfile } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";

type StatusFilter = MemberProfile["membershipStatus"] | "all";

const STATUSES: MemberProfile["membershipStatus"][] = ["pending", "active", "suspended"];

const STATUS_LABEL: Record<MemberProfile["membershipStatus"], string> = {
    active: "Active",
    pending: "Pending",
    suspended: "Suspended",
};

const STATUS_BADGE: Record<MemberProfile["membershipStatus"], string> = {
    active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    suspended: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
};

const ACTION_LABEL: Record<MemberProfile["membershipStatus"], string> = {
    active: "Approve",
    pending: "Send back to pending",
    suspended: "Suspend",
};

const ACTION_ICON: Record<MemberProfile["membershipStatus"], React.ComponentType<{ className?: string }>> = {
    active: UserCheck,
    pending: Clock,
    suspended: Ban,
};

const ACTION_TONE: Record<MemberProfile["membershipStatus"], string> = {
    active: "bg-emerald-600 hover:bg-emerald-700 text-white",
    pending: "bg-amber-500 hover:bg-amber-600 text-white",
    suspended: "bg-red-600 hover:bg-red-700 text-white",
};

export default function AdminMembersPage() {
    const [members, setMembers] = useState<MemberProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
    const [reasons, setReasons] = useState<Record<string, string>>({});
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const data = await listMembers();
            setMembers(data);
        } catch (loadError) {
            console.error("Failed to load members:", loadError);
            setError("Failed to load members.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const counts = useMemo(() => countMembersByStatus(members), [members]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return members.filter((member) => {
            const matchesStatus = statusFilter === "all" || member.membershipStatus === statusFilter;
            const matchesSearch =
                !term ||
                member.displayName.toLowerCase().includes(term) ||
                member.email.toLowerCase().includes(term) ||
                (member.phone || "").toLowerCase().includes(term) ||
                (member.familyName || "").toLowerCase().includes(term);
            return matchesStatus && matchesSearch;
        });
    }, [members, search, statusFilter]);

    const applyStatus = async (member: MemberProfile, nextStatus: MemberProfile["membershipStatus"]) => {
        const reason = (reasons[member.uid] || "").trim();
        if (nextStatus === "suspended" && !reason) {
            setError("Please add a reason before suspending a member.");
            return;
        }
        setBusyId(member.uid);
        setError("");
        try {
            await setMembershipStatus(member.uid, nextStatus, reason || undefined);
            setReasons((current) => ({ ...current, [member.uid]: "" }));
            await load();
        } catch (statusError) {
            console.error("Failed to update membership status:", statusError);
            setError("Failed to update member status. Please try again.");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-secondary-900 dark:text-white">
                        Member Approvals
                    </h1>
                    <p className="mt-1 text-secondary-500 dark:text-secondary-400">
                        Review new signups, approve members, and manage account status.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={load}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary-900 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-black dark:bg-white dark:text-secondary-900"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <StatusCard label="Pending Review" value={counts.pending} icon={Clock} tone="amber" />
                <StatusCard label="Active Members" value={counts.active} icon={ShieldCheck} tone="emerald" />
                <StatusCard label="Suspended" value={counts.suspended} icon={Ban} tone="red" />
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full rounded-xl border border-secondary-200 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-primary-500 dark:border-secondary-800 dark:bg-secondary-900"
                        placeholder="Search by name, email, phone, or family"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="rounded-xl border border-secondary-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-primary-500 dark:border-secondary-800 dark:bg-secondary-900"
                >
                    <option value="all">All Statuses</option>
                    {STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {STATUS_LABEL[status]}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </p>
            )}

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-44 animate-pulse rounded-2xl bg-white dark:bg-secondary-900" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-secondary-200 bg-white p-12 text-center dark:border-secondary-800 dark:bg-secondary-900">
                    <UsersIcon className="mx-auto h-10 w-10 text-secondary-300" />
                    <p className="mt-3 font-bold text-secondary-600 dark:text-secondary-300">
                        No members match your filters.
                    </p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {filtered.map((member) => {
                        const nextActions = STATUSES.filter((status) => status !== member.membershipStatus);
                        const reasonValue = reasons[member.uid] ?? "";
                        return (
                            <li
                                key={member.id}
                                className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm dark:border-secondary-800 dark:bg-secondary-900"
                            >
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${STATUS_BADGE[member.membershipStatus]}`}
                                            >
                                                {STATUS_LABEL[member.membershipStatus]}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary-400">
                                                <Clock className="h-3 w-3" />
                                                Joined {formatTimeAgo(member.createdAt)}
                                            </span>
                                            {member.statusUpdatedAt && (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary-400">
                                                    <UserCog className="h-3 w-3" />
                                                    Updated {formatTimeAgo(member.statusUpdatedAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-secondary-900 dark:text-white">
                                                {member.displayName || "Unnamed Member"}
                                            </h2>
                                            <dl className="mt-2 space-y-1 text-sm text-secondary-500 dark:text-secondary-400">
                                                <Detail icon={Mail} value={member.email} />
                                                {member.phone && <Detail icon={Phone} value={member.phone} />}
                                                {member.address && <Detail icon={MapPin} value={member.address} />}
                                                {member.familyName && (
                                                    <Detail icon={UsersIcon} value={`Family: ${member.familyName}`} />
                                                )}
                                            </dl>
                                        </div>
                                        {member.statusReason && (
                                            <p className="rounded-xl bg-secondary-50 p-3 text-sm font-medium text-secondary-700 dark:bg-secondary-950 dark:text-secondary-300">
                                                <span className="block text-xs font-black uppercase tracking-widest text-secondary-400">
                                                    Last admin note
                                                </span>
                                                {member.statusReason}
                                            </p>
                                        )}
                                    </div>

                                    <div className="w-full space-y-3 lg:max-w-sm">
                                        <label className="block space-y-2">
                                            <span className="text-xs font-black uppercase tracking-widest text-secondary-500">
                                                Reason / note (optional, required for suspension)
                                            </span>
                                            <textarea
                                                value={reasonValue}
                                                onChange={(event) =>
                                                    setReasons((current) => ({
                                                        ...current,
                                                        [member.uid]: event.target.value,
                                                    }))
                                                }
                                                className="h-24 w-full resize-none rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-medium outline-none focus:border-primary-500 dark:border-secondary-800 dark:bg-secondary-950"
                                                placeholder="Shared with the member in their notification inbox."
                                            />
                                        </label>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {nextActions.map((nextStatus) => {
                                                const Icon = ACTION_ICON[nextStatus];
                                                return (
                                                    <button
                                                        key={nextStatus}
                                                        type="button"
                                                        onClick={() => applyStatus(member, nextStatus)}
                                                        disabled={busyId === member.uid}
                                                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60 ${ACTION_TONE[nextStatus]}`}
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                        {busyId === member.uid ? "Saving..." : ACTION_LABEL[nextStatus]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

const TONE_CLASS = {
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    red: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
} as const;

function StatusCard({
    label,
    value,
    icon: Icon,
    tone,
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    tone: keyof typeof TONE_CLASS;
}) {
    return (
        <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-secondary-500">{label}</p>
                    <p className="mt-2 text-3xl font-black text-secondary-900 dark:text-white">{value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONE_CLASS[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function Detail({
    icon: Icon,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-secondary-400" />
            <span className="truncate">{value}</span>
        </div>
    );
}

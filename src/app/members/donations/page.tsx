"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, ReceiptText } from "lucide-react";
import { useMember } from "@/contexts/MemberContext";
import { downloadDonationReceipt } from "@/lib/donation-receipts";
import { getMemberDonations } from "@/lib/members";
import { Donation } from "@/lib/types";
import { formatCurrency, formatMaskedCurrency } from "@/lib/utils";

export default function MemberDonationsPage() {
    const { user } = useMember();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        getMemberDonations(user.uid)
            .then(setDonations)
            .catch((error) => console.error("Failed to load member donations:", error))
            .finally(() => setLoading(false));
    }, [user]);

    const total = donations
        .filter((donation) => donation.status === "completed")
        .reduce((sum, donation) => sum + donation.amount, 0);

    return (
        <section className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black text-secondary-900 dark:text-white">Donation History</h1>
                    <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">View donations linked to your member account.</p>
                </div>
                <Link href="/donations" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-black text-white hover:bg-primary-700">
                    Donate <ExternalLink className="h-4 w-4" />
                </Link>
            </div>

            <div className="mt-6 rounded-lg bg-primary-50 p-4 dark:bg-primary-950/20">
                <p className="text-sm font-bold text-primary-700 dark:text-primary-300">Completed Total</p>
                <p className="mt-1 text-3xl font-black text-primary-900 dark:text-primary-100">{formatCurrency(total)}</p>
            </div>

            <div className="mt-6 space-y-3">
                {loading ? (
                    <p className="text-sm text-secondary-500">Loading donation records...</p>
                ) : donations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-secondary-200 p-8 text-center dark:border-secondary-800">
                        <ReceiptText className="mx-auto h-10 w-10 text-secondary-300" />
                        <p className="mt-3 font-bold text-secondary-700 dark:text-secondary-200">No linked donations yet.</p>
                    </div>
                ) : donations.map((donation) => (
                    <div key={donation.id} className="flex flex-col gap-4 rounded-lg border border-secondary-200 p-4 dark:border-secondary-800 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-black text-secondary-900 dark:text-white">{formatMaskedCurrency(donation.amount)} · {donation.type}</p>
                            <p className="text-sm text-secondary-500">{new Date(donation.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300">
                                {donation.status}
                            </span>
                            {donation.status === "completed" && (
                                <button
                                    type="button"
                                    onClick={() => downloadDonationReceipt(donation)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-primary-200 px-3 py-2 text-xs font-black uppercase tracking-widest text-primary-700 transition-colors hover:bg-primary-50 dark:border-primary-900/50 dark:text-primary-300 dark:hover:bg-primary-950/30"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Receipt
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

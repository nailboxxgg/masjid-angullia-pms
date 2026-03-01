"use client";

import { useState, useEffect } from "react";
import { Donation } from "@/lib/types";
import { deleteDonation, updateDonationStatus, getDonations, getDonationStats, DonationStats } from "@/lib/donations";
import Modal from "@/components/ui/modal";
import { Download, Upload } from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

import StatsOverview from "./StatsOverview";
import DonationFilters from "./DonationFilters";
import DonationTable from "./DonationTable";
import ImportModal from "./ImportModal";

export default function FinancesPage() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [stats, setStats] = useState<DonationStats>({
        totalCollected: 0,
        monthlyCollected: 0,
        breakdown: {},
        recentDonations: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [donationToDelete, setDonationToDelete] = useState<string | null>(null);

    const [typeFilter, setTypeFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState("");

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 }
        }
    };

    const handleStatusUpdate = async (id: string, status: Donation['status']) => {
        // Optimistic update
        setDonations(prev => prev.map(d => d.id === id ? { ...d, status } : d));

        const success = await updateDonationStatus(id, status);
        if (!success) {
            alert("Failed to update status.");
            // Revert on failure
            loadData();
        }
    };

    const handleDelete = (id: string) => {

        setDonationToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (donationToDelete) {
            const success = await deleteDonation(donationToDelete);
            if (success) {
                loadData();
            } else {
                alert("Failed to delete donation. Please try again.");
            }
            setIsDeleteModalOpen(false);
            setDonationToDelete(null);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        const statsData = await getDonationStats();
        // Use the recent donations from stats for initial view, or fetch full list if needed
        // For now, we are patching specific recent donations, but let's assume we want a fuller list for the table
        // or just use what stats gave us if we want to be fast.
        // But the table has pagination/search, so let's fetch a bit more for the table part.
        const fullList = await getDonations(100);

        setStats(statsData);
        setDonations(fullList);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredDonations = donations.filter(donation => {
        const matchesSearch = (donation.donorName || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || donation.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const handleExportCSV = () => {
        if (filteredDonations.length === 0) {
            alert("No donations to export.");
            return;
        }

        const exportData = filteredDonations.map(d => ({
            Date: new Date(d.date).toLocaleDateString(),
            Donor: d.isAnonymous ? "Anonymous" : d.donorName,
            Amount: d.amount,
            Type: d.type,
            Status: d.status,
            "Payment Method": d.paymentMethod || "",
            "Reference #": d.referenceNumber || "",
            Message: d.message || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Donations");
        XLSX.writeFile(workbook, `donations_export_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <motion.div variants={itemVariants}>
                    <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white uppercase tracking-tighter">Donations & Finances</h1>
                    <p className="text-secondary-900 dark:text-secondary-200 mt-1 font-medium italic text-balance">Comprehensive tracking of masjid funds and community contributions.</p>
                </motion.div>
                <motion.div variants={itemVariants} className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsImportOpen(true)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 dark:bg-primary-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 dark:hover:bg-primary-800 shadow-xl shadow-primary-500/20 transition-all shrink-0"
                    >
                        <Upload className="w-4 h-4" /> Import Data
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExportCSV}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary-900 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-secondary-800 shadow-sm transition-all"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </motion.button>
                </motion.div>
            </div>

            <StatsOverview stats={stats} />

            <div className="space-y-4">
                <DonationFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                />

                <DonationTable
                    donations={filteredDonations}
                    isLoading={isLoading}
                    role={null}
                    onStatusUpdate={handleStatusUpdate}
                    onDelete={handleDelete}
                />
            </div>

            <ImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={loadData}
            />

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Deletion"
            >
                <div className="space-y-4 py-2 bg-white dark:bg-secondary-900">
                    <p className="text-sm font-semibold text-secondary-900 dark:text-secondary-200">
                        Are you sure you want to delete this donation? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-sm font-bold text-secondary-900 dark:text-white hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 rounded-md shadow-sm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
}

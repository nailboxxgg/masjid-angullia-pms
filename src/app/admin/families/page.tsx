"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Users, Users2 } from "lucide-react";
import Modal from "@/components/ui/modal";
import FamilyForm from "@/components/modules/families/FamilyForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getFamilies, deleteFamily } from "@/lib/families";
import { Family } from "@/lib/types";

import { motion } from "framer-motion";

export default function AdminFamiliesPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [familyToDelete, setFamilyToDelete] = useState<{ id: string, name: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [families, setFamilies] = useState<Family[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
        },
        hover: {
            y: -5,
            transition: { duration: 0.2 }
        }
    };

    const loadFamilies = async () => {
        setIsLoading(true);
        const data = await getFamilies();
        setFamilies(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadFamilies();
    }, []);

    const handleDeleteClick = (family: Family) => {
        setFamilyToDelete({ id: family.id, name: family.name });
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (familyToDelete) {
            await deleteFamily(familyToDelete.id);
            setIsDeleteModalOpen(false);
            setFamilyToDelete(null);
            loadFamilies();
        }
    };

    const handleEdit = (family: Family) => {
        setSelectedFamily(family);
        setIsEditModalOpen(true);
    };

    const filteredFamilies = families.filter(family =>
        (family.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (family.head || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-10"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div variants={itemVariants}>
                    <h1 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white uppercase tracking-tighter">Family Registry</h1>
                    <p className="text-secondary-900 dark:text-secondary-200 mt-1 font-medium italic text-balance">Centrally manage and organize the masjid community members.</p>
                </motion.div>
                <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl text-sm font-bold bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 h-10 px-6 shadow-lg hover:bg-black dark:hover:bg-secondary-100 transition-all shrink-0"
                >
                    <Plus className="mr-2 h-4 w-4" /> Register Family
                </motion.button>
            </div>

            <motion.div variants={itemVariants}>
                <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm overflow-hidden rounded-2xl">
                    <CardHeader className="p-4 border-b border-secondary-100 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-800/30">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                            <input
                                type="text"
                                placeholder="Search by family name or head of family..."
                                className="w-full sm:w-96 pl-10 pr-4 py-2.5 rounded-xl border-none text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-950 text-secondary-900 placeholder:text-secondary-400 dark:text-secondary-100 shadow-sm ring-1 ring-secondary-200 dark:ring-secondary-800"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-secondary-50 dark:bg-secondary-950/50 border-b border-secondary-100 dark:border-secondary-800 font-bold uppercase tracking-widest text-[10px] text-secondary-500">
                                        <th className="px-6 py-4">Family Name</th>
                                        <th className="px-6 py-4">Head of Family</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Members</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-4"><div className="h-4 w-32 bg-secondary-100 dark:bg-secondary-800 rounded-lg"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 w-24 bg-secondary-100 dark:bg-secondary-800 rounded-lg"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 w-16 bg-secondary-100 dark:bg-secondary-800 rounded-lg"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 w-20 bg-secondary-100 dark:bg-secondary-800 rounded-lg"></div></td>
                                                <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-secondary-100 dark:bg-secondary-800 rounded-lg ml-auto"></div></td>
                                            </tr>
                                        ))
                                    ) : filteredFamilies.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-24 text-center">
                                                <div className="max-w-xs mx-auto">
                                                    <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-full w-fit mx-auto mb-4">
                                                        <Users2 className="w-10 h-10 text-secondary-300 dark:text-secondary-600" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white uppercase tracking-tight">Community Empty</h3>
                                                    <p className="text-secondary-500 text-sm mt-1 font-medium italic">No family records found. Start by registering one!</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredFamilies.map((family) => (
                                            <tr key={family.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{family.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-secondary-900 dark:text-white font-bold text-[10px] ring-2 ring-white dark:ring-secondary-700 shadow-sm">
                                                            {family.head?.[0] || 'U'}
                                                        </div>
                                                        <span className="text-sm font-bold text-secondary-700 dark:text-secondary-200">{family.head || "Unknown"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50 shadow-sm">
                                                        <Users className="w-3 h-3" />
                                                        {Array.isArray(family.members) ? family.members.length : (family.members || 0)} Members
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(family)}
                                                            className="p-2 text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all border border-transparent hover:border-primary-100 dark:hover:border-primary-800/50"
                                                            title="Edit Family"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(family)}
                                                            className="p-2 text-secondary-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all border border-transparent hover:border-red-100 dark:hover:border-red-800/50"
                                                            title="Delete Family"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Modal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title="Register New Family"
                    className="max-w-2xl"
                >
                    <FamilyForm
                        onSuccess={() => {
                            setIsAddModalOpen(false);
                            loadFamilies();
                        }}
                        onCancel={() => setIsAddModalOpen(false)}
                    />
                </Modal>

                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Edit Family Information"
                    className="max-w-2xl"
                >
                    <FamilyForm
                        initialData={selectedFamily}
                        onSuccess={() => {
                            setIsEditModalOpen(false);
                            loadFamilies();
                        }}
                        onCancel={() => setIsEditModalOpen(false)}
                    />
                </Modal>

                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="Confirm Deletion"
                    className="max-w-md"
                >
                    <div className="space-y-4 py-2 bg-white dark:bg-secondary-900">
                        <p className="text-secondary-600 dark:text-secondary-400">
                            Are you sure you want to delete the family <span className="font-semibold text-secondary-900 dark:text-secondary-100">"{familyToDelete?.name}"</span>?
                            This action cannot be undone and will remove all family member records.
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 dark:bg-red-700 rounded-lg text-white hover:bg-red-700 dark:hover:bg-red-800 text-sm font-medium shadow-sm"
                            >
                                Delete Family
                            </button>
                        </div>
                    </div>
                </Modal>
            </motion.div>
        </motion.div>
    );
}

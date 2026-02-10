"use client";

import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import Modal from "@/components/ui/modal";
import FamilyForm from "@/components/modules/families/FamilyForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getFamilies, deleteFamily } from "@/lib/families";
import { Family } from "@/lib/types";

export default function AdminFamiliesPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [familyToDelete, setFamilyToDelete] = useState<{ id: string, name: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [families, setFamilies] = useState<Family[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-secondary-900 dark:text-secondary-100 font-heading">Family Registry</h1>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">Manage registered families and their members.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary-600 dark:bg-primary-700 text-white hover:bg-primary-700 dark:hover:bg-primary-800 h-10 px-4 shadow-sm transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" /> Register Family
                </button>
            </div>

            <Card className="shadow-sm transition-colors duration-300 bg-secondary-900 border-secondary-800 dark:bg-white dark:border-secondary-200 !dark:bg-white !dark:border-secondary-200">
                <CardHeader className="pb-3 border-b border-secondary-800 dark:border-secondary-100 !dark:border-secondary-100">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400 dark:text-secondary-500" />
                        <input
                            type="text"
                            placeholder="Search families..."
                            className="w-full sm:w-80 pl-9 pr-4 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors bg-secondary-800 border-secondary-700 text-secondary-100 placeholder:text-secondary-500 dark:bg-secondary-50 dark:border-secondary-200 dark:text-secondary-900 dark:placeholder:text-secondary-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="font-medium border-b transition-colors bg-secondary-800 text-secondary-200 border-secondary-700 dark:bg-secondary-50 dark:text-secondary-700 dark:border-secondary-200 !dark:bg-secondary-50 !dark:text-secondary-700 !dark:border-secondary-200">
                                <tr>
                                    <th className="px-6 py-3">Family Name</th>
                                    <th className="px-6 py-3">Head of Family</th>
                                    <th className="px-6 py-3">Members</th>
                                    <th className="px-6 py-3">Contact</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y transition-colors divide-secondary-800 dark:divide-secondary-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading families...</td>
                                    </tr>
                                ) : filteredFamilies.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            No families found matching specific search query.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFamilies.map((family) => (
                                        <tr key={family.id} className="transition-colors hover:bg-white/5 dark:hover:bg-secondary-50">
                                            <td className="px-6 py-4 font-medium text-white dark:text-secondary-900">{family.name}</td>
                                            <td className="px-6 py-4 text-secondary-300 dark:text-secondary-500">{family.head}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800 dark:bg-blue-50 dark:text-blue-700 dark:border-blue-100 transition-colors">
                                                    {Array.isArray(family.members) ? family.members.length : family.members} Members
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 transition-colors">
                                                <div className="flex flex-col text-xs">
                                                    <span className="text-secondary-200 dark:text-secondary-800">{family.phone}</span>
                                                    <span className="text-secondary-500 dark:text-secondary-400">{family.address}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleEdit(family)}
                                                        className="font-medium text-primary-400 hover:text-primary-300 dark:text-primary-600 dark:hover:text-primary-800 hover:underline transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(family)}
                                                        className="font-medium text-red-400 hover:text-red-300 dark:text-red-600 dark:hover:text-red-800 hover:underline transition-colors"
                                                    >
                                                        Delete
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
                <div className="space-y-4 py-2 bg-white dark:bg-secondary-900 transition-colors">
                    <p className="text-secondary-600 dark:text-secondary-400">
                        Are you sure you want to delete the family <span className="font-semibold text-secondary-900 dark:text-secondary-100">"{familyToDelete?.name}"</span>?
                        This action cannot be undone and will remove all family member records.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-600 dark:bg-red-700 rounded-lg text-white hover:bg-red-700 dark:hover:bg-red-800 text-sm font-medium shadow-sm transition-colors"
                        >
                            Delete Family
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

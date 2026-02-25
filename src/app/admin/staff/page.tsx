"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, User, UserPlus, Copy, Check, Users, MapPin, Phone, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getStaffList, createStaff, deleteStaff } from "@/lib/staff";
import { Staff } from "@/lib/types";
import { format } from "date-fns";
import AnimationWrapper from "@/components/ui/AnimationWrapper";

export default function AdminStaffPage() {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        contactNumber: "",
        address: "",
        role: "staff" as Staff['role'],
        department: "",
        email: ""
    });

    const loadStaff = async () => {
        setIsLoading(true);
        const data = await getStaffList();
        setStaffList(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

        const success = await deleteStaff(id);
        if (success) {
            setStaffList(prev => prev.filter(s => s.id !== id));
        } else {
            alert("Failed to delete staff member.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const success = await createStaff({
            name: formData.name,
            contactNumber: formData.contactNumber,
            address: formData.address,
            role: formData.role,
            department: formData.department,
            email: formData.email
        });

        if (success) {
            await loadStaff();
            setIsAddModalOpen(false);
            setFormData({
                name: "",
                contactNumber: "",
                address: "",
                role: "staff",
                department: "",
                email: ""
            });
        } else {
            alert("Failed to create staff member.");
        }
        setIsSubmitting(false);
    };

    const filteredStaff = staffList.filter(staff =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-secondary-900 dark:text-white font-heading tracking-tight mb-2">
                        Staff Management
                    </h1>
                    <p className="text-secondary-500 dark:text-secondary-400 text-lg font-medium">
                        Manage staff records and attendance IDs.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 px-6 py-3 rounded-2xl font-bold hover:bg-black dark:hover:bg-secondary-100 transition-all active:scale-95 shadow-xl shadow-secondary-900/10"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Add New Staff</span>
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                />
            </div>

            {/* Staff List */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white/50 dark:bg-secondary-900/50 rounded-[2rem] animate-pulse" />
                    ))}
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-secondary-900/50 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-secondary-200 dark:border-secondary-800">
                    <div className="w-20 h-20 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-secondary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white">No Staff Found</h3>
                    <p className="text-secondary-500 dark:text-secondary-400">Add staff members to generate attendance IDs.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.map((staff, idx) => (
                        <AnimationWrapper key={staff.id} animation="scaleIn" delay={idx * 0.05}>
                            <div className="bg-white dark:bg-secondary-900 rounded-[2rem] p-6 border border-secondary-100 dark:border-secondary-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-10 transition-opacity">
                                    <User className="w-32 h-32 -mr-8 -mt-8" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center font-black text-lg shadow-sm">
                                            {staff.name.charAt(0)}
                                        </div>
                                        <div className="flex bg-secondary-50 dark:bg-secondary-800 rounded-xl p-1 gap-1">
                                            <div className="px-3 py-1 bg-white dark:bg-secondary-700 rounded-lg shadow-sm text-xs font-mono font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                                                {staff.id}
                                                <button
                                                    onClick={() => handleCopyId(staff.id)}
                                                    className="hover:text-primary-500 transition-colors"
                                                    title="Copy ID"
                                                >
                                                    {copiedId === staff.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-secondary-900 dark:text-white font-heading mb-1">{staff.name}</h3>
                                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-6">{staff.role}</p>

                                    <div className="space-y-3 mb-6">
                                        {staff.department && (
                                            <div className="flex items-center gap-3 text-sm text-secondary-600 dark:text-secondary-400">
                                                <div className="w-8 h-8 rounded-lg bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center shrink-0">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium">{staff.department}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-sm text-secondary-600 dark:text-secondary-400">
                                            <div className="w-8 h-8 rounded-lg bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center shrink-0">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium">{staff.contactNumber}</span>
                                        </div>
                                        {staff.address && (
                                            <div className="flex items-center gap-3 text-sm text-secondary-600 dark:text-secondary-400">
                                                <div className="w-8 h-8 rounded-lg bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center shrink-0">
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium truncate">{staff.address}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-secondary-100 dark:border-secondary-800">
                                        <span className="text-xs font-medium text-secondary-400">
                                            Added {format(staff.createdAt, 'MMM d, yyyy')}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(staff.id, staff.name)}
                                            className="text-red-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </AnimationWrapper>
                    ))}
                </div>
            )}

            {/* Add Staff Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-secondary-900 rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <h2 className="text-2xl font-black text-secondary-900 dark:text-white font-heading mb-6">Add New Staff</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-secondary-500 uppercase tracking-wider">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-950 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-secondary-500 uppercase tracking-wider">Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value as Staff['role'] })}
                                            className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-950 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                                        >
                                            <option value="Staff">Staff</option>
                                            <option value="Volunteer">Volunteer</option>
                                            <option value="Intern">Intern</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-secondary-500 uppercase tracking-wider">Department</label>
                                        <input
                                            type="text"
                                            value={formData.department}
                                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-950 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                                            placeholder="e.g. Maintenance"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-secondary-500 uppercase tracking-wider">Contact Number</label>
                                    <input
                                        required
                                        type="tel"
                                        value={formData.contactNumber}
                                        onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-950 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                                        placeholder="0917..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-secondary-500 uppercase tracking-wider">Address</label>
                                    <input
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-950 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                                        placeholder="Full address"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 py-4 rounded-xl font-bold text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[2] py-4 rounded-xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isSubmitting ? "Creating..." : "Create Staff Record"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

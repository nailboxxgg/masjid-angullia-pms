"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getFeedbacks, FeedbackData, updateFeedbackStatus, deleteFeedback, clearAllFeedbacks } from "@/lib/feedback";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { MessageSquare, Mail, Phone, Clock, Search, Filter, Trash2, Check, AlertCircle, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

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

    const loadData = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        const data = await getFeedbacks();
        setFeedbacks(data);
        if (showLoading) setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateStatus = async (id: string, status: 'Read' | 'Resolved') => {
        const success = await updateFeedbackStatus(id, status);
        if (success) {
            // Update local state immediately for better responsiveness
            setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));

            if (selectedFeedback && selectedFeedback.id === id) {
                setSelectedFeedback({ ...selectedFeedback, status });
            }

            // Background sync without showing global loader
            loadData(false);
        }
    };

    const handleView = async (feedback: FeedbackData) => {
        setSelectedFeedback(feedback);
        setIsViewModalOpen(true);

        if (feedback.status === 'New' && feedback.id) {
            await handleUpdateStatus(feedback.id, 'Read');
        }
    };

    const handleDelete = (id: string) => {
        setFeedbackToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!feedbackToDelete) return;

        const success = await deleteFeedback(feedbackToDelete);
        if (success) {
            loadData();
            setIsDeleteModalOpen(false);
            setFeedbackToDelete(null);
        }
    };

    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const handleClearInbox = () => {
        setIsClearModalOpen(true);
    };

    const confirmClearInbox = async () => {
        setIsLoading(true);
        const success = await clearAllFeedbacks();
        if (success) {
            setFeedbacks([]);
            setIsClearModalOpen(false);
        }
        setIsLoading(false);
    };

    const filteredFeedbacks = feedbacks.filter(item => {
        const matchesSearch = (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (item.message?.toLowerCase() || "").includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        const matchesType = typeFilter === 'All' || item.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-10"
        >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-secondary-900 dark:text-white uppercase tracking-tighter">Community Inbox</h1>
                    <p className="text-secondary-900 dark:text-secondary-200 mt-1 font-medium italic text-sm md:text-base">Centrally manage community messages, inquiries, and service requests.</p>
                </div>
                {feedbacks.length > 0 && (
                    <button
                        onClick={handleClearInbox}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all shadow-sm self-end md:self-auto"
                    >
                        <Trash2 className="w-4 h-4" /> Clear Inbox
                    </button>
                )}
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800 shadow-sm overflow-hidden rounded-2xl">
                    <CardHeader className="pb-3 border-b border-secondary-100 dark:border-secondary-800 bg-secondary-50/30 dark:bg-secondary-800/20 p-4 md:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-20">
                            <div className="relative flex-1 w-full lg:max-w-sm">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-secondary-400" />
                                <input
                                    type="search"
                                    placeholder="Search inbox..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-secondary-950 border-none ring-1 ring-secondary-200 dark:ring-secondary-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-400 shadow-sm transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative w-full lg:w-auto">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={cn(
                                        "flex items-center justify-center w-full lg:w-auto gap-2 px-6 h-11 border-none ring-1 rounded-xl text-sm font-bold transition-all shadow-sm",
                                        statusFilter !== 'All' || typeFilter !== 'All'
                                            ? 'bg-primary-50 ring-primary-200 text-primary-700 dark:bg-primary-900/50 dark:ring-primary-800 dark:text-primary-400'
                                            : 'bg-white ring-secondary-200 text-secondary-900 hover:bg-secondary-50 dark:bg-secondary-800 dark:ring-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-700'
                                    )}
                                >
                                    <Filter className="w-4 h-4" /> Filter Views
                                </button>

                                <AnimatePresence>
                                    {isFilterOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-3 w-full sm:w-72 bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-800 p-5 space-y-4 z-50"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Process Status</label>
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                    className="w-full text-sm font-bold border-none ring-1 ring-secondary-200 dark:ring-secondary-800 bg-secondary-50 dark:bg-secondary-950 rounded-xl focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-white p-2.5 transition-all"
                                                >
                                                    <option value="All">All Statuses</option>
                                                    <option value="New">New / Unread</option>
                                                    <option value="Read">Opened</option>
                                                    <option value="Resolved">Resolved</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Submission Type</label>
                                                <select
                                                    value={typeFilter}
                                                    onChange={(e) => setTypeFilter(e.target.value)}
                                                    className="w-full text-sm font-bold border-none ring-1 ring-secondary-200 dark:ring-secondary-800 bg-secondary-50 dark:bg-secondary-950 rounded-xl focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:white p-2.5 transition-all"
                                                >
                                                    <option value="All">All Types</option>
                                                    <option value="Message">Direct Message</option>
                                                    <option value="Concern">Community Concern</option>
                                                    <option value="Request">Service Request</option>
                                                </select>
                                            </div>
                                            {(statusFilter !== 'All' || typeFilter !== 'All') && (
                                                <button
                                                    onClick={() => { setStatusFilter('All'); setTypeFilter('All'); }}
                                                    className="w-full text-xs text-red-600 dark:text-red-400 font-bold hover:underline py-2 bg-red-50 dark:bg-red-900/10 rounded-xl transition-all"
                                                >
                                                    Reset All Filters
                                                </button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 px-0">
                        <div className="px-4 md:px-6 pb-2">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-secondary-500 font-black uppercase tracking-widest text-xs">Syncing Inbox...</p>
                                </div>
                            ) : filteredFeedbacks.length === 0 ? (
                                <div className="bg-secondary-50 dark:bg-secondary-800/20 rounded-3xl border-2 border-dashed border-secondary-200 dark:border-secondary-800 p-10 md:p-20 text-center">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-secondary-200 dark:ring-secondary-700">
                                        <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-secondary-300 dark:text-secondary-600" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">Your Inbox is Clear</h3>
                                    <p className="text-secondary-500 font-medium italic mt-2 text-sm md:text-base">No community submissions match your current filters.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {filteredFeedbacks.map((item, index) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: index * 0.05 }}
                                                key={item.id}
                                                onClick={() => handleView(item)}
                                                className="p-4 md:p-6 rounded-3xl border border-secondary-100 dark:border-secondary-800 hover:shadow-2xl transition-all group cursor-pointer bg-white dark:bg-secondary-900 hover:border-primary-200 dark:hover:border-primary-900/50 relative overflow-hidden"
                                            >
                                                {item.status === 'New' && (
                                                    <div className="absolute top-0 left-0 w-1.5 md:w-2 h-full bg-primary-500" />
                                                )}

                                                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start justify-between">
                                                    <div className="flex items-start gap-4 md:gap-5 w-full">
                                                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 font-black bg-secondary-50 text-secondary-900 dark:bg-secondary-800 dark:text-white text-base md:text-xl shadow-inner ring-1 ring-secondary-100 dark:ring-secondary-700/50 group-hover:bg-primary-50 group-hover:text-primary-600 dark:group-hover:bg-primary-900/20 dark:group-hover:text-primary-400 transition-colors">
                                                            {item.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-bold text-secondary-900 dark:text-secondary-100 text-base md:text-xl group-hover:text-black dark:group-hover:text-white transition-colors tracking-tight truncate">{item.name || 'Anonymous'}</h4>
                                                                {item.status === 'New' && (
                                                                    <span className="flex h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-primary-500 ring-4 ring-primary-500/20 animate-pulse shrink-0" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-[13px] font-bold text-secondary-500">
                                                                {item.email && (
                                                                    <span className="flex items-center gap-1.5 group-hover:text-secondary-700 dark:group-hover:text-secondary-300 transition-colors truncate max-w-[150px] sm:max-w-none">
                                                                        <Mail className="w-3.5 h-3.5 text-primary-500/60 shrink-0" /> <span className="truncate">{item.email}</span>
                                                                    </span>
                                                                )}
                                                                {item.contactNumber && (
                                                                    <span className="flex items-center gap-1.5 group-hover:text-secondary-700 dark:group-hover:text-secondary-300 transition-colors">
                                                                        <Phone className="w-3.5 h-3.5 text-emerald-500/60 shrink-0" /> {item.contactNumber}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pl-14 md:pl-0">
                                                        <span className={cn(
                                                            "px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                                            item.type === 'Concern' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30' :
                                                                item.type === 'Request' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30' :
                                                                    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                                        )}>
                                                            {item.type}
                                                        </span>
                                                        <span className={cn(
                                                            "px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                                            item.status === 'New' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                                                                item.status === 'Resolved' ? 'bg-secondary-100 text-secondary-600 border-secondary-200 dark:bg-secondary-800 dark:text-secondary-400 dark:border-secondary-700' :
                                                                    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-secondary-800/50 dark:text-secondary-300 dark:border-secondary-700'
                                                        )}>
                                                            {item.status}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-secondary-400 bg-secondary-50 dark:bg-secondary-800/50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl border border-secondary-100 dark:border-secondary-800">
                                                            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                            {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : 'Pending'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 md:mt-6 ml-0 md:ml-16">
                                                    <div className="p-4 md:p-5 rounded-2xl bg-secondary-50/50 dark:bg-secondary-950 text-secondary-800 dark:text-secondary-200 font-medium text-xs md:text-sm leading-relaxed line-clamp-2 border border-secondary-100 dark:border-secondary-800 shadow-inner group-hover:bg-white dark:group-hover:bg-secondary-900 transition-all">
                                                        {item.message}
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform translate-y-0 sm:translate-y-3 sm:group-hover:translate-y-0">
                                                        {item.status !== 'Resolved' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdateStatus(item.id!, 'Resolved');
                                                                }}
                                                                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl border border-emerald-100 dark:border-emerald-900/30 transition-all shadow-sm w-full sm:w-auto"
                                                            >
                                                                <Check className="w-4 h-4" /> Resolve
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(item.id!);
                                                            }}
                                                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl border border-rose-100 dark:border-rose-900/30 transition-all shadow-sm w-full sm:w-auto"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Purge
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={selectedFeedback ? `${selectedFeedback.type} Details` : "Submission Details"}
                className="max-w-2xl"
            >
                {selectedFeedback && (
                    <div className="space-y-6 md:space-y-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 border-b border-secondary-100 dark:border-secondary-800 pb-8">
                            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0 text-primary-600 dark:text-primary-400 font-black text-2xl md:text-3xl shadow-xl ring-4 ring-primary-500/10">
                                    {selectedFeedback.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h4 className="font-black text-secondary-900 dark:text-white text-2xl md:text-3xl tracking-tight">{selectedFeedback.name || 'Anonymous'}</h4>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm font-bold text-secondary-500 mt-2">
                                        {selectedFeedback.email && (
                                            <span className="flex items-center justify-center sm:justify-start gap-2">
                                                <Mail className="w-4 h-4" /> {selectedFeedback.email}
                                            </span>
                                        )}
                                        {selectedFeedback.contactNumber && (
                                            <span className="flex items-center justify-center sm:justify-start gap-2">
                                                <Phone className="w-4 h-4" /> {selectedFeedback.contactNumber}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center sm:items-end gap-3 text-center sm:text-right">
                                <span className={cn(
                                    "px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border shadow-md",
                                    selectedFeedback.type === 'Concern' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30' :
                                        selectedFeedback.type === 'Request' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30' :
                                            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30'
                                )}>
                                    {selectedFeedback.type}
                                </span>
                                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary-400 italic">
                                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" /> {selectedFeedback.createdAt?.toDate ? new Date(selectedFeedback.createdAt.toDate()).toLocaleString('en-PH', { dateStyle: 'full', timeStyle: 'short' }) : "Pending"}
                                </span>
                            </div>
                        </div>

                        <div className="bg-secondary-50/50 dark:bg-secondary-950 p-6 md:p-8 rounded-3xl border border-secondary-100 dark:border-secondary-800 shadow-inner">
                            <h5 className="text-[10px] font-black text-secondary-900 dark:text-white uppercase tracking-[0.2em] mb-4 opacity-40">Original Submission Body</h5>
                            <p className="text-secondary-800 dark:text-secondary-100 whitespace-pre-wrap leading-relaxed font-bold text-base md:text-lg italic">
                                "{selectedFeedback.message}"
                            </p>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4 pt-4">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-full sm:w-auto px-6 py-3.5 border-none ring-1 ring-secondary-200 dark:ring-secondary-700 rounded-2xl text-secondary-900 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-secondary-800 text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Dismiss
                            </button>
                            {selectedFeedback.type === 'Registration' ? (
                                <Link
                                    href={`/admin/requests?search=${encodeURIComponent(selectedFeedback.name)}`}
                                    onClick={() => {
                                        // Optional: Mark as Read automatically when navigating? 
                                        // For now, let's just navigate. The user can resolve it later or we can add auto-resolve logic.
                                        setIsViewModalOpen(false);
                                    }}
                                    className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 dark:bg-blue-700 rounded-2xl text-white hover:bg-blue-700 dark:hover:bg-blue-800 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Users className="w-4 h-4" /> Approve Request
                                </Link>
                            ) : (
                                selectedFeedback.status !== 'Resolved' && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            handleUpdateStatus(selectedFeedback.id!, 'Resolved');
                                            setIsViewModalOpen(false);
                                        }}
                                        className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 dark:bg-emerald-700 rounded-2xl text-white hover:bg-emerald-700 dark:hover:bg-emerald-800 text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" /> Finalize & Resolve
                                    </motion.button>
                                )
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Security Authority"
                className="max-w-md"
            >
                <div className="flex flex-col items-center justify-center text-center py-8">
                    <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-8 text-rose-600 dark:text-rose-400 shadow-xl ring-8 ring-rose-500/5">
                        <AlertCircle className="w-12 h-12" />
                    </div>

                    <h3 className="text-3xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter mb-3">Irreversible Action</h3>
                    <p className="text-secondary-500 font-bold mb-10 max-w-xs leading-relaxed italic">
                        You are about to permanently purge this record from the community logs. This cannot be undone.
                    </p>

                    <div className="flex gap-4 w-full px-4">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 px-6 py-4 border-none ring-1 ring-secondary-200 dark:ring-secondary-700 text-secondary-900 dark:text-secondary-300 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 px-6 py-4 bg-rose-600 dark:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-rose-700 dark:hover:bg-rose-800 shadow-2xl shadow-rose-600/30 transition-all"
                        >
                            Confirm Purge
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Clear Inbox Confirmation Modal */}
            <Modal
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                title="Dangerous Action"
                className="max-w-md"
            >
                <div className="flex flex-col items-center justify-center text-center py-8">
                    <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-8 text-rose-600 dark:text-rose-400 shadow-xl ring-8 ring-rose-500/5">
                        <Trash2 className="w-12 h-12" />
                    </div>

                    <h3 className="text-3xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter mb-3">Clear Entire Inbox?</h3>
                    <p className="text-secondary-500 font-bold mb-10 max-w-xs leading-relaxed italic">
                        This will permanently delete <span className="text-rose-600 dark:text-rose-400 font-black underline">{feedbacks.length} messages</span> from the inbox. This action is 100% irreversible.
                    </p>

                    <div className="flex gap-4 w-full px-4">
                        <button
                            onClick={() => setIsClearModalOpen(false)}
                            className="flex-1 px-6 py-4 border-none ring-1 ring-secondary-200 dark:ring-secondary-700 text-secondary-900 dark:text-secondary-300 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmClearInbox}
                            className="flex-1 px-6 py-4 bg-rose-600 dark:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-rose-700 dark:hover:bg-rose-800 shadow-2xl shadow-rose-600/30 transition-all"
                        >
                            Yes, Clear All
                        </button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
}

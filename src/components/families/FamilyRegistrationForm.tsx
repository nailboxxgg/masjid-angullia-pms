"use client";

import { useState } from "react";
import { Plus, Trash2, Send, CheckCircle, AlertCircle, User, MapPin, Phone, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addFamily } from "@/lib/families";
import { submitFeedback } from "@/lib/feedback";
import { FamilyMember } from "@/lib/types";
import { cn, normalizePhoneNumber } from "@/lib/utils";

export default function FamilyRegistrationForm({ onSuccess }: { onSuccess?: () => void }) {
    const [headName, setHeadName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [members, setMembers] = useState<FamilyMember[]>([]);

    // Member input state
    const [memberName, setMemberName] = useState("");
    const [memberRelation, setMemberRelation] = useState("");

    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState("");

    const handleAddMember = () => {
        if (!memberName.trim() || !memberRelation.trim()) return;

        const newMember: FamilyMember = {
            id: crypto.randomUUID(),
            name: memberName,
            relation: memberRelation,
            isDeceased: false
        };

        setMembers([...members, newMember]);
        setMemberName("");
        setMemberRelation("");
    };

    const removeMember = (id: string) => {
        setMembers(members.filter(m => m.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!headName.trim() || !address.trim() || !phone.trim()) {
            setErrorMsg("Please fill in all required fields.");
            setStatus('error');
            return;
        }

        setStatus('submitting');
        setErrorMsg("");

        try {
            const familyData = {
                name: headName, // Using Head's name as Family Name for now
                head: headName,
                address: address,
                phone: normalizePhoneNumber(phone),
                members: members,
                status: 'pending' as const, // Explicitly pending
                createdAt: Date.now()
            };

            const result = await addFamily(familyData);

            if (result) {
                // Trigger Admin Notification
                await submitFeedback({
                    name: headName,
                    email: "N/A", // Email not currently collected in this form
                    contactNumber: normalizePhoneNumber(phone),
                    type: 'Registration',
                    message: `New Family Registration: ${headName} with ${members.length + 1} total members. Address: ${address}`
                });

                setStatus('success');
                if (onSuccess) setTimeout(onSuccess, 3000);
            } else {
                throw new Error("Failed to submit registration.");
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMsg("Something went wrong. Please try again.");
        }
    };

    if (status === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 px-6 text-center"
            >
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                    <CheckCircle className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-black text-secondary-900 dark:text-white mb-3 tracking-tight font-heading">Registration Sent!</h3>
                <p className="text-secondary-500 dark:text-secondary-400 text-lg max-w-sm mx-auto font-medium">
                    Your family registration has been submitted for review. Jazakallah Khair.
                </p>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Head of Family */}
            <div className="space-y-4">
                <h4 className="text-sm font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4" /> Head of Family
                </h4>
                <div className="grid grid-cols-1 gap-4">
                    <input
                        required
                        value={headName}
                        onChange={(e) => setHeadName(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-950/50 focus:bg-white dark:focus:bg-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-secondary-900 dark:text-white transition-all placeholder:text-secondary-400 text-base font-bold shadow-sm"
                        placeholder="Full Name (e.g. Juan Dela Cruz)"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                            <input
                                required
                                type="tel"
                                inputMode="numeric"
                                maxLength={11}
                                value={phone}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    if (value.length <= 11) setPhone(value);
                                }}
                                className="w-full pl-11 pr-5 py-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-950/50 focus:bg-white dark:focus:bg-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-secondary-900 dark:text-white transition-all placeholder:text-secondary-400 text-base font-medium shadow-sm"
                                placeholder="Phone Number"
                            />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                            <input
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full pl-11 pr-5 py-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-950/50 focus:bg-white dark:focus:bg-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-secondary-900 dark:text-white transition-all placeholder:text-secondary-400 text-base font-medium shadow-sm"
                                placeholder="Barangay / Address"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-secondary-100 dark:border-secondary-800" />

            {/* Family Members */}
            <div className="space-y-4">
                <h4 className="text-sm font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4" /> Family Members
                </h4>

                {/* Add Member Input */}
                <div className="p-4 bg-secondary-50 dark:bg-secondary-900/50 rounded-2xl border border-secondary-100 dark:border-secondary-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-950 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-bold"
                            placeholder="Member Name"
                        />
                        <div className="flex gap-2">
                            <input
                                value={memberRelation}
                                onChange={(e) => setMemberRelation(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-950 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium"
                                placeholder="Relation (e.g. Wife, Son)"
                                list="relations-list"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
                            />
                            <datalist id="relations-list">
                                <option value="Wife" />
                                <option value="Husband" />
                                <option value="Son" />
                                <option value="Daughter" />
                                <option value="Father" />
                                <option value="Mother" />
                                <option value="Brother" />
                                <option value="Sister" />
                                <option value="Asawa" />
                                <option value="Anak" />
                                <option value="Magulang" />
                                <option value="Kapatid" />
                                <option value="Tito" />
                                <option value="Tita" />
                                <option value="Lolo" />
                                <option value="Lola" />
                            </datalist>

                            <button
                                type="button"
                                onClick={handleAddMember}
                                disabled={!memberName.trim() || !memberRelation.trim()}
                                className="px-4 py-3 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-xl hover:bg-black dark:hover:bg-secondary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <p className="text-[10px] text-secondary-400 font-medium pl-1">* Add members one by one</p>
                </div>

                {/* Member List */}
                <div className="space-y-2">
                    <AnimatePresence>
                        {members.map((member) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 shadow-sm"
                            >
                                <div>
                                    <p className="font-bold text-sm text-secondary-900 dark:text-white">{member.name}</p>
                                    <p className="text-xs text-secondary-500 dark:text-secondary-400">{member.relation}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeMember(member.id)}
                                    className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {members.length === 0 && (
                        <p className="text-center text-secondary-400 text-sm italic py-2">No members added yet.</p>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/30"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="font-medium">{errorMsg || "Failed to submit."}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                {status === 'submitting' ? (
                    "Submitting..."
                ) : (
                    <>
                        Complete Registration <Send className="w-5 h-5" />
                    </>
                )}
            </button>
        </form>
    );
}
